import { describe, expect, test } from "@jest/globals";
import { checkIntegrity } from "../../src/migration/self-check";
import { MigrationExport } from "../../src/migration/types";

const base = (): MigrationExport => ({
  obvody: [
    { KOD: 10001, NAZEV: null, POZNAMKA: null, OBEC_KOD: 500001, TYP_OBVODU_KOD: "1" },
  ],
  okrsky: [
    {
      KOD: 100001,
      KOD_ISUI: null,
      NAZEV: null,
      CISLO: 1,
      POZNAMKA: null,
      OBEC_KOD: 500001,
      TYP_OBVODU_KOD: "1",
    },
    {
      KOD: 100002,
      KOD_ISUI: null,
      NAZEV: null,
      CISLO: 2,
      POZNAMKA: null,
      OBEC_KOD: 500001,
      TYP_OBVODU_KOD: "1",
    },
  ],
  skoKo: [
    { SKO_KOD: 10001, KO_KOD: 100001 },
    { SKO_KOD: 10001, KO_KOD: 100002 },
  ],
  defBody: [
    { ID: 1, KO_KOD: 100001, geometry: { type: "Point", coordinates: [14, 50] } },
    { ID: 2, KO_KOD: 100002, geometry: { type: "Point", coordinates: [14.1, 50.1] } },
  ],
  hrany: [
    {
      ID: 3,
      KO_KOD1: 100001,
      KO_KOD2: 100002,
      geometry: { type: "LineString", coordinates: [[14, 50], [14, 50.1]] },
    },
  ],
  skolaSko: [
    {
      SKO_KOD: 10001,
      SKOLA_IZO: 600001111,
      TRIDA_1: "A", TRIDA_2: "A", TRIDA_3: "A", TRIDA_4: "A", TRIDA_5: "A",
      TRIDA_6: "N", TRIDA_7: "N", TRIDA_8: "N", TRIDA_9: "N",
    },
  ],
  vymezeni: [],
});

describe("checkIntegrity", () => {
  test("passes a well-formed export", () => {
    expect(checkIntegrity(base())).toEqual([]);
  });

  test("flags an okrsek without a def point", () => {
    const d = base();
    d.defBody = d.defBody.slice(0, 1);
    expect(checkIntegrity(d).some((p) => p.includes("expected 1 def point"))).toBe(true);
  });

  test("flags a duplicate CISLO within an obec + type", () => {
    const d = base();
    d.okrsky[1].CISLO = 1;
    expect(checkIntegrity(d).some((p) => p.includes("duplicate CISLO"))).toBe(true);
  });

  test("allows the same CISLO across different types (independent okrsek sets)", () => {
    const d = base();
    d.okrsky[1].CISLO = 1;
    d.okrsky[1].TYP_OBVODU_KOD = "M"; // same obec, different type -> not a dup
    expect(checkIntegrity(d).some((p) => p.includes("duplicate CISLO"))).toBe(false);
  });

  test("flags a dangling MIG_SKO_KO reference", () => {
    const d = base();
    d.skoKo.push({ SKO_KOD: 99999, KO_KOD: 100001 });
    expect(checkIntegrity(d).some((p) => p.includes("unknown SKO_KOD 99999"))).toBe(true);
  });

  test("flags an obvod/okrsek type mismatch (MI02)", () => {
    const d = base();
    d.okrsky[0].TYP_OBVODU_KOD = "M";
    expect(checkIntegrity(d).some((p) => p.includes("type mismatch"))).toBe(true);
  });

  test("flags an obvod with no okrsek and no whole-obec coverage (MI04)", () => {
    const d = base();
    d.skoKo = [];
    expect(checkIntegrity(d).some((p) => p.includes("MI04 risk"))).toBe(true);
  });

  test("accepts a whole-obec obvod with no okrsek", () => {
    const d = base();
    d.skoKo = [];
    d.vymezeni = [{ OBEC_KOD: 500001, SKO_KOD: 10001 }];
    expect(checkIntegrity(d).some((p) => p.includes("MI04 risk"))).toBe(false);
  });

  test("flags a self-referential seam", () => {
    const d = base();
    d.hrany[0].KO_KOD2 = d.hrany[0].KO_KOD1;
    expect(checkIntegrity(d).some((p) => p.includes("self-seam"))).toBe(true);
  });

  test("flags a duplicate obvod KOD (allocator regression)", () => {
    const d = base();
    d.obvody.push({ ...d.obvody[0] });
    expect(checkIntegrity(d).some((p) => p.includes("duplicate obvod KOD"))).toBe(true);
  });

  test("flags a duplicate MIG_SKO_KO link row (MI14)", () => {
    const d = base();
    d.skoKo.push({ ...d.skoKo[0] });
    expect(checkIntegrity(d).some((p) => p.includes("duplicate MIG_SKO_KO"))).toBe(true);
  });

  test("flags a duplicate MIG_SKOLA_SKO row (MI14)", () => {
    const d = base();
    d.skolaSko.push({ ...d.skolaSko[0] });
    expect(checkIntegrity(d).some((p) => p.includes("duplicate MIG_SKOLA_SKO"))).toBe(true);
  });

  test("flags a duplicate whole-obec coverage row (MI12)", () => {
    const d = base();
    d.skoKo = [];
    d.vymezeni = [
      { OBEC_KOD: 500001, SKO_KOD: 10001 },
      { OBEC_KOD: 500001, SKO_KOD: 10001 },
    ];
    expect(checkIntegrity(d).some((p) => p.includes("duplicate MIG_VYMEZENI"))).toBe(true);
  });

  test("flags a grade flag outside the obvod's type band (MI13)", () => {
    const d = base();
    d.skolaSko[0].TRIDA_6 = "A"; // a type-1 obvod must not flag grade 6
    expect(checkIntegrity(d).some((p) => p.includes("MI13"))).toBe(true);
  });

  test("accepts 2.stupeň grade flags on a type-2 obvod (MI13)", () => {
    const d = base();
    d.obvody[0].TYP_OBVODU_KOD = "2";
    d.okrsky.forEach((o) => (o.TYP_OBVODU_KOD = "2"));
    d.skolaSko[0] = {
      SKO_KOD: 10001,
      SKOLA_IZO: 600001111,
      TRIDA_1: "N", TRIDA_2: "N", TRIDA_3: "N", TRIDA_4: "N", TRIDA_5: "N",
      TRIDA_6: "A", TRIDA_7: "A", TRIDA_8: "A", TRIDA_9: "A",
    };
    expect(checkIntegrity(d).some((p) => p.includes("MI13"))).toBe(false);
  });

  test("flags a vymezeni row pointing at an unknown obvod (MI11)", () => {
    const d = base();
    d.vymezeni = [{ OBEC_KOD: 555000, SKO_KOD: 99999 }];
    expect(
      checkIntegrity(d).some((p) => p.includes("MIG_VYMEZENI_ZBYLYCH_KO: unknown SKO_KOD"))
    ).toBe(true);
  });

  test("flags a non-finite def point coordinate (F3 data-quality)", () => {
    const d = base();
    d.defBody[0].geometry.coordinates = [NaN, 50];
    expect(checkIntegrity(d).some((p) => p.includes("non-finite coordinate"))).toBe(true);
  });

  test("flags a degenerate seam geometry (F3 data-quality)", () => {
    const d = base();
    d.hrany[0].geometry.coordinates = [[14, 50]];
    expect(checkIntegrity(d).some((p) => p.includes("degenerate geometry"))).toBe(true);
  });
});
