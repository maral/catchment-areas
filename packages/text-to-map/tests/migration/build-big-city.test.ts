import { describe, expect, test } from "@jest/globals";
import { featureCollection, polygon } from "@turf/helpers";
import { PolygonsByCodes } from "../../src/db/types";
import { buildBigCityTables } from "../../src/migration/build-big-city";
import { ObecBuildContext, counter } from "../../src/migration/build-obec";
import { Municipality } from "../../src/street-markdown/types";

const B = (x: number, y: number): [number, number] => [
  14.4 + x * 0.01,
  50.0 + y * 0.01,
];
const addr = (address: string, x: number, y: number, municipalityCode?: number) => {
  const [lng, lat] = B(x, y);
  return municipalityCode ? { address, lng, lat, municipalityCode } : { address, lng, lat };
};

// two adjacent districts sharing the line x=5
const squareA = polygon([[B(0, 0), B(5, 0), B(5, 10), B(0, 10), B(0, 0)]]);
const squareB = polygon([[B(5, 0), B(10, 0), B(10, 10), B(5, 10), B(5, 0)]]);
const districtPolygons: PolygonsByCodes = {
  1: featureCollection([squareA]),
  2: featureCollection([squareB]),
};

const district = (code: number, izo: string, pts: ReturnType<typeof addr>[]): Municipality => ({
  municipalityName: `MČ ${code}`,
  code,
  municipalityType: "district",
  cityCodes: [],
  districtCodes: [code],
  unmappedPoints: [],
  areas: [{ index: 0, schools: [{ name: `S${code}`, izo }], addresses: pts }],
});

const CITY = 555000;
const ctx = (): ObecBuildContext => ({
  obecKod: CITY,
  typeCode: "1",
  allocObvodKod: counter(10001),
  allocOkrsekKod: counter(100001),
  allocId: counter(1),
  gradesByIzo: () => undefined,
});

describe("buildBigCityTables", () => {
  test("pools districts into one obec with a district-line seam", () => {
    const a = district(1, "600000001", [addr("A1", 2, 3), addr("A2", 2, 7)]);
    const b = district(2, "600000002", [addr("B1", 8, 3), addr("B2", 8, 7)]);

    const t = buildBigCityTables(CITY, "1", [a, b], {}, districtPolygons, ctx());

    expect(t.obvody).toHaveLength(2);
    expect(t.okrsky).toHaveLength(2);
    for (const o of [...t.obvody, ...t.okrsky]) expect(o.OBEC_KOD).toBe(CITY);
    // the shared x=5 district line is an interior seam
    expect(t.hrany.length).toBeGreaterThanOrEqual(1);
    // one def point per okrsek, each okrsek linked to one obvod
    expect(t.defBody).toHaveLength(2);
    expect(t.skoKo).toHaveLength(2);
    // CISLO unique within the pooled obec
    expect(new Set(t.okrsky.map((o) => o.CISLO)).size).toBe(2);
  });

  test("cross-district catchment: a school's stamped piece becomes an okrsek in the other district, same ŠO", () => {
    // district-1 school also owns an address that physically sits in district 2
    const a = district(1, "600000001", [
      addr("A1", 2, 3),
      addr("A2", 2, 7),
      addr("A-in-B", 8, 5, 2), // stamped as district 2
    ]);
    const b = district(2, "600000002", [addr("B1", 8, 2), addr("B2", 8, 8)]);

    const t = buildBigCityTables(CITY, "1", [a, b], {}, districtPolygons, ctx());

    // school S1's ŠO should be linked to TWO okrsky (home in d1, piece in d2)
    const s1Kod = t.obvody.find((o) => t.skolaSko.some((s) => s.SKO_KOD === o.KOD && s.SKOLA_IZO === 600000001))!.KOD;
    const s1Okrsky = t.skoKo.filter((l) => l.SKO_KOD === s1Kod);
    expect(s1Okrsky.length).toBe(2);
    // still one obvod per school (not duplicated across districts)
    expect(t.obvody).toHaveLength(2);
    // every okrsek belongs to the city obec
    for (const o of t.okrsky) expect(o.OBEC_KOD).toBe(CITY);
  });

  test("a district claimed whole by two founders is tessellated once, as one shared okrsek", () => {
    // district 3 (x 10..15) has no founder; both 1 and 2 claim it whole
    // ("území městské části"), so its addresses sit in both areas
    const squareC = polygon([[B(10, 0), B(15, 0), B(15, 10), B(10, 10), B(10, 0)]]);
    const polygons: PolygonsByCodes = { ...districtPolygons, 3: featureCollection([squareC]) };
    const inC = [addr("C1", 12, 3), addr("C2", 12, 7)];
    const a = { ...district(1, "600000001", [addr("A1", 2, 5), ...inC]), districtCodes: [1, 3] };
    const b = { ...district(2, "600000002", [addr("B1", 8, 5), ...inC]), districtCodes: [2, 3] };

    const t = buildBigCityTables(CITY, "1", [a, b], {}, polygons, ctx());

    // A's, B's own okrsek + one shared okrsek for district 3 — not two overlapping ones
    expect(t.okrsky).toHaveLength(3);
    const linksByKo = new Map<number, number[]>();
    for (const l of t.skoKo) linksByKo.set(l.KO_KOD, [...(linksByKo.get(l.KO_KOD) ?? []), l.SKO_KOD]);
    expect([...linksByKo.values()].map((v) => v.length).sort()).toEqual([1, 1, 2]);
  });

  test("a district with no founder of its own still gets okrsky from the pieces stamped into it", () => {
    // district 2 founds no school of this type; district 1's school takes one
    // of its addresses ("zbytek části obce …") — that piece must cover district 2
    const a: Municipality = {
      ...district(1, "600000001", [addr("A1", 2, 2), addr("A-in-2", 8, 5, 2)]),
    };
    a.areas.push({ index: 1, schools: [{ name: "S1b", izo: "600000003" }], addresses: [addr("A2", 2, 8)] });

    const t = buildBigCityTables(
      CITY, "1", [a], {}, districtPolygons, ctx(), new Map([[2, CITY]])
    );

    // district 1 split in two + district 2 as one okrsek of the first school
    expect(t.okrsky).toHaveLength(3);
    const s1 = t.skolaSko.find((s) => s.SKOLA_IZO === 600000001)!.SKO_KOD;
    expect(t.skoKo.filter((l) => l.SKO_KOD === s1)).toHaveLength(2);
  });

  test("a whole-city founder's territory keeps districts no other founder tessellates", () => {
    // the city founder lists only district 1 whole and reaches into district 2
    // by street; district 2's polygon is in the run-wide map (another type
    // named it) — it must not be subtracted from the city territory
    const city = polygon([[B(0, 0), B(10, 0), B(10, 10), B(0, 10), B(0, 0)]]);
    const leftover: Municipality = {
      municipalityName: "Město",
      code: CITY,
      municipalityType: "city",
      cityCodes: [CITY],
      districtCodes: [1],
      unmappedPoints: [],
      areas: [
        { index: 0, schools: [{ name: "S1", izo: "600000001" }], addresses: [addr("A1", 2, 5)] },
        { index: 1, schools: [{ name: "S2", izo: "600000002" }], addresses: [addr("B1", 8, 5)] },
      ],
    };

    const t = buildBigCityTables(
      CITY, "1", [leftover], { [CITY]: featureCollection([city]) }, districtPolygons, ctx()
    );

    // two okrsky meeting at x=5, one seam, nothing cut out at district 2
    expect(t.okrsky).toHaveLength(2);
    expect(t.hrany).toHaveLength(1);
  });

  test("an unstamped address in another district is reported as a data problem, not rerouted", () => {
    const a: Municipality = district(1, "600000001", [addr("A1", 2, 2), addr("in-2", 8, 5)]);
    a.areas.push({ index: 1, schools: [{ name: "S1b", izo: "600000003" }], addresses: [addr("A2", 2, 8)] });
    const problems: string[] = [];

    const t = buildBigCityTables(
      CITY, "1", [a], {}, districtPolygons, { ...ctx(), problems }, new Map([[1, CITY], [2, CITY]])
    );

    expect(t.okrsky).toHaveLength(2);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/assigns 1 address\(es\) in district 2 .* "in-2"/);
  });

  test("an unstamped address in a district with its own founder is out of scope, not reported", () => {
    const a: Municipality = district(1, "600000001", [addr("A1", 2, 2), addr("in-2", 8, 5)]);
    const b: Municipality = district(2, "600000002", [addr("B1", 8, 8)]);
    const problems: string[] = [];

    buildBigCityTables(
      CITY, "1", [a, b], {}, districtPolygons, { ...ctx(), problems }, new Map([[1, CITY], [2, CITY]])
    );

    expect(problems).toEqual([]);
  });
});
