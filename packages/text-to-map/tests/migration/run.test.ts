import { describe, expect, test } from "@jest/globals";
import { featureCollection, polygon } from "@turf/helpers";
import { PolygonsByCodes } from "../../src/db/types";
import {
  assembleExport,
  ExportGroup,
  pruneEmptyObvody,
} from "../../src/migration/run";
import { MigrationExport } from "../../src/migration/types";
import { Municipality } from "../../src/street-markdown/types";

const B = (x: number, y: number): [number, number] => [
  14.4 + x * 0.01,
  50.0 + y * 0.01,
];
const addr = (address: string, x: number, y: number) => {
  const [lng, lat] = B(x, y);
  return { address, lng, lat };
};
const square = polygon([[B(0, 0), B(10, 0), B(10, 10), B(0, 10), B(0, 0)]]);

// A complex obec (two schools -> tessellated) exported as type "1".
const obecA: Municipality = {
  municipalityName: "A",
  code: 500001,
  municipalityType: "city",
  cityCodes: [500001],
  districtCodes: [],
  unmappedPoints: [],
  areas: [
    { index: 0, schools: [{ name: "A-Left", izo: "600000001" }], addresses: [addr("AL1", 2, 2), addr("AL2", 2, 8)] },
    { index: 1, schools: [{ name: "A-Right", izo: "600000002" }], addresses: [addr("AR1", 8, 2), addr("AR2", 8, 8)] },
  ],
};

// A trivial obec (one area = whole obec) exported as type "M".
const obecB: Municipality = {
  municipalityName: "B",
  code: 500002,
  municipalityType: "city",
  cityCodes: [500002],
  districtCodes: [],
  unmappedPoints: [],
  areas: [
    { index: 0, schools: [{ name: "B-Only", izo: "600000009" }], addresses: [addr("B1", 5, 5)] },
  ],
};

const boundaries: PolygonsByCodes = {
  500001: featureCollection([square]),
  500002: featureCollection([square]),
};

const groups: ExportGroup[] = [
  { municipalities: [obecA], typeCode: "1" },
  { municipalities: [obecB], typeCode: "M" },
];

describe("assembleExport (multi-group, shared code space)", () => {
  test("produces one export spanning both types with globally-unique codes", () => {
    const data = assembleExport(groups, boundaries, {}, new Map());

    // 3 obvody total: 2 from A (type 1), 1 from B (type M)
    expect(data.obvody).toHaveLength(3);
    const kods = data.obvody.map((o) => o.KOD);
    expect(new Set(kods).size).toBe(3); // no collisions across groups

    // types carried per group
    const typesByKod = new Map(data.obvody.map((o) => [o.KOD, o.TYP_OBVODU_KOD]));
    expect(data.obvody.filter((o) => o.OBEC_KOD === 500001).every((o) => o.TYP_OBVODU_KOD === "1")).toBe(true);
    expect(data.obvody.filter((o) => o.OBEC_KOD === 500002).every((o) => o.TYP_OBVODU_KOD === "M")).toBe(true);

    // A tessellates; B is trivial -> vymezeni, no okrsky of its own
    expect(data.okrsky.length).toBeGreaterThan(0);
    for (const ok of data.okrsky) expect(ok.OBEC_KOD).toBe(500001);
    expect(data.vymezeni).toHaveLength(1);
    expect(data.vymezeni[0].OBEC_KOD).toBe(500002);

    // okrsek codes disjoint from obvod codes (different allocators/spaces)
    const okrsekKods = new Set(data.okrsky.map((o) => o.KOD));
    for (const k of kods) expect(okrsekKods.has(k)).toBe(false);
    // sanity: the trivial obvod is the vymezeni target and is a real obvod
    expect(typesByKod.has(data.vymezeni[0].SKO_KOD!)).toBe(true);
  });

  test("is deterministic across runs", () => {
    expect(assembleExport(groups, boundaries, {}, new Map())).toEqual(
      assembleExport(groups, boundaries, {}, new Map())
    );
  });
});

describe("pruneEmptyObvody (MI04)", () => {
  const skola = (SKO_KOD: number, SKOLA_IZO: number) => ({
    SKO_KOD,
    SKOLA_IZO,
    TRIDA_1: "A" as const,
    TRIDA_2: "N" as const,
    TRIDA_3: "N" as const,
    TRIDA_4: "N" as const,
    TRIDA_5: "N" as const,
    TRIDA_6: "N" as const,
    TRIDA_7: "N" as const,
    TRIDA_8: "N" as const,
    TRIDA_9: "N" as const,
  });
  const base = (): MigrationExport => ({
    obvody: [
      { KOD: 10001, NAZEV: null, POZNAMKA: null, OBEC_KOD: 500001, TYP_OBVODU_KOD: "1" },
      { KOD: 10002, NAZEV: null, POZNAMKA: null, OBEC_KOD: 500001, TYP_OBVODU_KOD: "1" }, // empty
      { KOD: 10003, NAZEV: null, POZNAMKA: null, OBEC_KOD: 500001, TYP_OBVODU_KOD: "M" }, // whole-obec
    ],
    okrsky: [
      { KOD: 100001, KOD_ISUI: null, NAZEV: null, CISLO: 1, POZNAMKA: null, OBEC_KOD: 500001, TYP_OBVODU_KOD: "1" },
    ],
    skoKo: [{ SKO_KOD: 10001, KO_KOD: 100001 }],
    defBody: [],
    hrany: [],
    skolaSko: [skola(10001, 111), skola(10002, 222), skola(10003, 333)],
    vymezeni: [{ OBEC_KOD: 500001, SKO_KOD: 10003 }],
  });

  test("drops a ŠO with no okrsek and no whole-obec row, keeping the rest", () => {
    const { data, dropped } = pruneEmptyObvody(base());

    // only 10002 is dropped (10001 has an okrsek, 10003 has vymezeni)
    expect(dropped).toHaveLength(1);
    expect(dropped[0]).toMatchObject({
      KOD: 10002,
      OBEC_KOD: 500001,
      TYP_OBVODU_KOD: "1",
      izos: [222],
    });
    expect(data.obvody.map((o) => o.KOD)).toEqual([10001, 10003]);
    // its MIG_SKOLA_SKO row goes with it; the others stay
    expect(data.skolaSko.map((s) => s.SKO_KOD).sort()).toEqual([10001, 10003]);
    // okrsky / links untouched
    expect(data.skoKo).toEqual([{ SKO_KOD: 10001, KO_KOD: 100001 }]);
  });

  test("no empty ŠO -> returns input unchanged, no drops", () => {
    const input = base();
    input.obvody = input.obvody.filter((o) => o.KOD !== 10002);
    input.skolaSko = input.skolaSko.filter((s) => s.SKO_KOD !== 10002);
    const { data, dropped } = pruneEmptyObvody(input);
    expect(dropped).toHaveLength(0);
    expect(data).toBe(input);
  });
});
