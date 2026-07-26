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

  test("trivial obec (one area = whole obec) -> one vymezeni row, no geometry (B3)", () => {
    const trivial: Municipality = {
      ...municipality,
      areas: [
        {
          index: 0,
          schools: [{ name: "Only", izo: "600009999" }],
          addresses: [addr("O-1", 5, 5)],
        },
      ],
    };
    const tables = buildObecTables(trivial, boundary, makeContext());

    expect(tables.obvody).toHaveLength(1);
    expect(tables.skolaSko).toHaveLength(1);
    expect(tables.okrsky).toHaveLength(0);
    expect(tables.skoKo).toHaveLength(0);
    expect(tables.defBody).toHaveLength(0);
    expect(tables.hrany).toHaveLength(0);

    expect(tables.vymezeni).toEqual([
      { OBEC_KOD: 500001, SKO_KOD: tables.obvody[0].KOD },
    ]);
  });

  test("absorbed whole village -> MIG_VYMEZENI_ZBYLYCH_KO for that area's ŠO (§8)", () => {
    const withVillage: Municipality = {
      ...municipality,
      areas: [
        { ...municipality.areas[0], absorbedWholeObce: [555000] },
        municipality.areas[1],
      ],
    };
    const tables = buildObecTables(withVillage, boundary, makeContext());

    // still a complex obec: geometry is produced
    expect(tables.okrsky.length).toBeGreaterThan(0);
    // one whole-village row, pointing at an existing obvod
    expect(tables.vymezeni).toHaveLength(1);
    expect(tables.vymezeni[0].OBEC_KOD).toBe(555000);
    const obvodKods = new Set(tables.obvody.map((o) => o.KOD));
    expect(obvodKods.has(tables.vymezeni[0].SKO_KOD!)).toBe(true);
  });

  test("trivial obec that also absorbs a village emits both rows", () => {
    const trivialWithVillage: Municipality = {
      ...municipality,
      areas: [
        {
          index: 0,
          schools: [{ name: "Only", izo: "600009999" }],
          addresses: [addr("O-1", 5, 5)],
          absorbedWholeObce: [555000],
        },
      ],
    };
    const tables = buildObecTables(trivialWithVillage, boundary, makeContext());
    const sko = tables.obvody[0].KOD;
    expect(tables.vymezeni).toEqual([
      { OBEC_KOD: 555000, SKO_KOD: sko },
      { OBEC_KOD: 500001, SKO_KOD: sko },
    ]);
  });
});

const grades1to9: SchoolGrades = {
  t1: true, t2: true, t3: true, t4: true, t5: true,
  t6: true, t7: true, t8: true, t9: true,
};

const ctxWith = (
  typeCode: "M" | "1" | "2",
  gradesByIzo: (izo: string) => SchoolGrades | undefined
): ObecBuildContext => ({
  obecKod: 500001,
  typeCode,
  allocObvodKod: counter(10000),
  allocOkrsekKod: counter(100000),
  allocId: counter(1),
  gradesByIzo,
});

describe("buildObecTables — 2.stupeň (Part E)", () => {
  test("no school teaches 6–9 -> full okrsek partition, all orphan (E3)", () => {
    const t = buildObecTables(municipality, boundary, ctxWith("2", () => grades1to5));
    expect(t.obvody).toHaveLength(0); // no type-2 ŠO
    expect(t.okrsky).toHaveLength(2); // same partition as 1.stupeň
    for (const o of t.okrsky) expect(o.TYP_OBVODU_KOD).toBe("2");
    expect(t.skoKo).toHaveLength(0); // every okrsek orphan
    expect(t.skolaSko).toHaveLength(0);
    expect(t.defBody).toHaveLength(2);
    expect(t.hrany).toHaveLength(1);
  });

  test("only the 6–9 school gets a type-2 ŠO with TRIDA_6..9 (E2)", () => {
    const gradesByIzo = (izo: string) =>
      izo === "600001111" ? grades1to9 : grades1to5;
    const t = buildObecTables(municipality, boundary, ctxWith("2", gradesByIzo));

    expect(t.obvody).toHaveLength(1);
    expect(t.okrsky).toHaveLength(2); // full partition, one linked one orphan
    const obvod = t.obvody[0];
    expect(obvod.TYP_OBVODU_KOD).toBe("2");
    const ss = t.skolaSko.find((s) => s.SKO_KOD === obvod.KOD)!;
    expect(ss.SKOLA_IZO).toBe(600001111);
    expect([ss.TRIDA_6, ss.TRIDA_7, ss.TRIDA_8, ss.TRIDA_9]).toEqual(["A", "A", "A", "A"]);
    expect([ss.TRIDA_1, ss.TRIDA_5]).toEqual(["N", "N"]);
    // exactly the linked school's okrsek(s) reference the ŠO; the other is orphan
    expect(t.skoKo.every((l) => l.SKO_KOD === obvod.KOD)).toBe(true);
    expect(t.skoKo.length).toBeGreaterThanOrEqual(1);
  });

  test("trivial obec type-2: ŠO when 6–9 present, else null whole-obec coverage (E4)", () => {
    const trivial = (izo: string): Municipality => ({
      ...municipality,
      areas: [{ index: 0, schools: [{ name: "Only", izo }], addresses: [addr("O", 5, 5)] }],
    });

    const withStage = buildObecTables(trivial("600001111"), boundary, ctxWith("2", () => grades1to9));
    expect(withStage.obvody).toHaveLength(1);
    expect(withStage.vymezeni).toEqual([
      { OBEC_KOD: 500001, SKO_KOD: withStage.obvody[0].KOD },
    ]);

    const noStage = buildObecTables(trivial("600001111"), boundary, ctxWith("2", () => grades1to5));
    expect(noStage.obvody).toHaveLength(0);
    expect(noStage.vymezeni).toEqual([{ OBEC_KOD: 500001, SKO_KOD: null }]);
  });
});
