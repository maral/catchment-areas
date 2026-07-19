import { describe, expect, test } from "@jest/globals";
import { featureCollection, polygon } from "@turf/helpers";
import {
  ObecBuildContext,
  buildObecTables,
  counter,
} from "../../src/migration/build-obec";
import { SchoolGrades } from "../../src/migration/types";
import { Area, Municipality } from "../../src/street-markdown/types";

const B = (x: number, y: number): [number, number] => [
  14.4 + x * 0.01,
  50.0 + y * 0.01,
];
const addr = (address: string, x: number, y: number) => {
  const [lng, lat] = B(x, y);
  return { address, lng, lat };
};

const areas: Area[] = [
  {
    index: 0,
    schools: [{ name: "Left", izo: "600001111" }],
    addresses: [addr("L-1", 2, 2), addr("L-2", 2, 8)],
  },
  {
    index: 1,
    schools: [{ name: "Right", izo: "600002222" }],
    addresses: [addr("R-1", 8, 2), addr("R-2", 8, 8)],
  },
];

const municipality: Municipality = {
  municipalityName: "Test",
  code: 500001,
  municipalityType: "city",
  cityCodes: [500001],
  districtCodes: [],
  areas,
  unmappedPoints: [],
};

const boundary = polygon([[B(0, 0), B(10, 0), B(10, 10), B(0, 10), B(0, 0)]]);

// both schools teach 1.-5. grade only (a plain 1.stupeň school)
const grades1to5: SchoolGrades = {
  t1: true,
  t2: true,
  t3: true,
  t4: true,
  t5: true,
  t6: false,
  t7: false,
  t8: false,
  t9: false,
};

const makeContext = (): ObecBuildContext => ({
  obecKod: 500001,
  typeCode: "1",
  allocObvodKod: counter(10000),
  allocOkrsekKod: counter(100000),
  allocId: counter(1),
  gradesByIzo: () => grades1to5,
});

describe("buildObecTables", () => {
  test("assembles obvody, okrsky, links, def points and seams for one obec", () => {
    const tables = buildObecTables(municipality, boundary, makeContext());

    expect(tables.obvody).toHaveLength(2);
    expect(tables.okrsky).toHaveLength(2);
    expect(tables.skolaSko).toHaveLength(2);
    expect(tables.defBody).toHaveLength(2);
    expect(tables.hrany).toHaveLength(1);

    // every okrsek is linked to exactly one obvod (no overlaps here)
    expect(tables.skoKo).toHaveLength(2);
    const obvodKods = new Set(tables.obvody.map((o) => o.KOD));
    const okrsekKods = new Set(tables.okrsky.map((o) => o.KOD));
    for (const link of tables.skoKo) {
      expect(obvodKods.has(link.SKO_KOD)).toBe(true);
      expect(okrsekKods.has(link.KO_KOD)).toBe(true);
    }

    // CISLO is 1..N within the obec; obec code + type propagate
    expect(tables.okrsky.map((o) => o.CISLO).sort()).toEqual([1, 2]);
    for (const okrsek of tables.okrsky) {
      expect(okrsek.OBEC_KOD).toBe(500001);
      expect(okrsek.TYP_OBVODU_KOD).toBe("1");
    }

    // the seam references the two okrsek codes
    const seam = tables.hrany[0];
    expect(okrsekKods.has(seam.KO_KOD1)).toBe(true);
    expect(okrsekKods.has(seam.KO_KOD2)).toBe(true);
    expect(seam.geometry.type).toBe("LineString");
  });

  test("grade flags = school grades intersected with the type band (MI13)", () => {
    const tables = buildObecTables(municipality, boundary, makeContext());
    for (const row of tables.skolaSko) {
      // 1.stupeň band, school teaches 1-5 -> TRIDA_1..5 = A, 6..9 = N
      expect([
        row.TRIDA_1,
        row.TRIDA_2,
        row.TRIDA_3,
        row.TRIDA_4,
        row.TRIDA_5,
      ]).toEqual(["A", "A", "A", "A", "A"]);
      expect([
        row.TRIDA_6,
        row.TRIDA_7,
        row.TRIDA_8,
        row.TRIDA_9,
      ]).toEqual(["N", "N", "N", "N"]);
      expect(typeof row.SKOLA_IZO).toBe("number");
    }
  });

  test("is deterministic: same input + fresh allocators -> identical tables", () => {
    const a = buildObecTables(municipality, boundary, makeContext());
    const b = buildObecTables(municipality, boundary, makeContext());
    expect(b).toEqual(a);
  });
});
