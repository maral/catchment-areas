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
});
