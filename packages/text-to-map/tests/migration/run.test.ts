import { describe, expect, test } from "@jest/globals";
import { featureCollection, polygon } from "@turf/helpers";
import { PolygonsByCodes } from "../../src/db/types";
import {
  assembleExport,
  ExportGroup,
  pruneEmptyObvody,
  pruneUnknownSchools,
  withDbRetry,
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

    const realVymezeni = data.vymezeni.filter((v) => v.SKO_KOD !== null);
    expect(realVymezeni).toHaveLength(1);
    expect(realVymezeni[0].OBEC_KOD).toBe(500002);
    // sanity: the trivial obvod is the vymezeni target and is a real obvod
    expect(typesByKod.has(realVymezeni[0].SKO_KOD!)).toBe(true);

    // MI11 fill-in: A only submitted type "1", B only "M" -> each gets a
    // blanket null row declaring "no ŠO" for its two missing types
    const nullVymezeni = data.vymezeni.filter((v) => v.SKO_KOD === null);
    expect(new Set(nullVymezeni.map((v) => v.OBEC_KOD))).toEqual(
      new Set([500001, 500002])
    );

    // okrsek codes disjoint from obvod codes (different allocators/spaces)
    const okrsekKods = new Set(data.okrsky.map((o) => o.KOD));
    for (const k of kods) expect(okrsekKods.has(k)).toBe(false);
  });

  test("is deterministic across runs", () => {
    expect(assembleExport(groups, boundaries, {}, new Map())).toEqual(
      assembleExport(groups, boundaries, {}, new Map())
    );
  });

  test("CISLO is unique within an obec across types, not just within one type (CR0025)", () => {
    // Same obec (A), tessellated for both type "1" and type "M" — each call
    // mints its own okrsky, but CR0025 requires one continuous CISLO sequence
    // per obec regardless of type.
    const multiType: ExportGroup[] = [
      { municipalities: [obecA], typeCode: "1" },
      { municipalities: [obecA], typeCode: "M" },
    ];
    const data = assembleExport(multiType, boundaries, {}, new Map());

    const obecAOkrsky = data.okrsky.filter((o) => o.OBEC_KOD === 500001);
    expect(obecAOkrsky.length).toBe(4); // 2 per type
    expect(obecAOkrsky.some((o) => o.TYP_OBVODU_KOD === "1")).toBe(true);
    expect(obecAOkrsky.some((o) => o.TYP_OBVODU_KOD === "M")).toBe(true);

    const cisla = obecAOkrsky.map((o) => o.CISLO).sort((a, b) => a - b);
    expect(cisla).toEqual([1, 2, 3, 4]); // continuous, no cross-type collision
    expect(new Set(cisla).size).toBe(4);
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

describe("pruneUnknownSchools (MI07)", () => {
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
      { KOD: 10002, NAZEV: null, POZNAMKA: null, OBEC_KOD: 500001, TYP_OBVODU_KOD: "1" }, // its only school is unregistered
    ],
    okrsky: [
      { KOD: 100001, KOD_ISUI: null, NAZEV: null, CISLO: 1, POZNAMKA: null, OBEC_KOD: 500001, TYP_OBVODU_KOD: "1" },
      { KOD: 100002, KOD_ISUI: null, NAZEV: null, CISLO: 2, POZNAMKA: null, OBEC_KOD: 500001, TYP_OBVODU_KOD: "1" },
    ],
    skoKo: [
      { SKO_KOD: 10001, KO_KOD: 100001 },
      { SKO_KOD: 10002, KO_KOD: 100002 },
    ],
    defBody: [],
    hrany: [],
    skolaSko: [skola(10001, 111), skola(10002, 999)], // IZO 999 isn't in the registry
    vymezeni: [{ OBEC_KOD: 555000, SKO_KOD: 10002 }], // an absorbed village pointing at the doomed obvod
  });
  const registered = {
    t1: true, t2: false, t3: false, t4: false, t5: false,
    t6: false, t7: false, t8: false, t9: false,
  };
  const gradesByIzo = (izo: string) => (izo === "111" ? registered : undefined);

  test("drops a school not in the registry and cascades to its now-empty obvod", () => {
    const { data, droppedSchools, droppedObvody } = pruneUnknownSchools(base(), gradesByIzo);

    expect(droppedSchools).toEqual([{ SKO_KOD: 10002, SKOLA_IZO: 999 }]);
    expect(droppedObvody).toHaveLength(1);
    expect(droppedObvody[0]).toMatchObject({
      KOD: 10002,
      OBEC_KOD: 500001,
      TYP_OBVODU_KOD: "1",
      izos: [999],
    });

    expect(data.obvody.map((o) => o.KOD)).toEqual([10001]);
    expect(data.skolaSko.map((s) => s.SKO_KOD)).toEqual([10001]);
    expect(data.skoKo).toEqual([{ SKO_KOD: 10001, KO_KOD: 100001 }]);
    expect(data.vymezeni).toEqual([]); // the row pointing at the dropped obvod goes too
    // its okrsek geometry is left untouched — now orphan, which is allowed (MI02)
    expect(data.okrsky.map((o) => o.KOD)).toEqual([100001, 100002]);
  });

  test("every school known -> returns input unchanged, no drops", () => {
    const input = base();
    input.skolaSko[1] = skola(10002, 111);
    const { data, droppedSchools, droppedObvody } = pruneUnknownSchools(input, gradesByIzo);
    expect(droppedSchools).toHaveLength(0);
    expect(droppedObvody).toHaveLength(0);
    expect(data).toBe(input);
  });
});

describe("withDbRetry", () => {
  const noDelay = () => 0;
  const transient = (code: string) => Object.assign(new Error(code), { code });

  test("retries a transient error and eventually succeeds", async () => {
    let calls = 0;
    const retries: number[] = [];
    const result = await withDbRetry(
      async () => {
        calls++;
        if (calls < 3) throw transient("ETIMEDOUT");
        return "ok";
      },
      (attempt) => retries.push(attempt),
      5,
      noDelay
    );
    expect(result).toBe("ok");
    expect(calls).toBe(3);
    expect(retries).toEqual([1, 2]); // two retries before the 3rd call worked
  });

  test("does not retry a non-transient error", async () => {
    let calls = 0;
    await expect(
      withDbRetry(
        async () => {
          calls++;
          throw Object.assign(new Error("ER_PARSE_ERROR"), { code: "ER_PARSE_ERROR" });
        },
        undefined,
        5,
        noDelay
      )
    ).rejects.toThrow("ER_PARSE_ERROR");
    expect(calls).toBe(1);
  });

  test("gives up after the attempt cap and rethrows the last error", async () => {
    let calls = 0;
    await expect(
      withDbRetry(
        async () => {
          calls++;
          throw transient("ECONNRESET");
        },
        undefined,
        3,
        noDelay
      )
    ).rejects.toThrow("ECONNRESET");
    expect(calls).toBe(3);
  });
});
