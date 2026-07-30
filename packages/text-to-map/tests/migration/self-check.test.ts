import { describe, expect, test } from "@jest/globals";
import { checkIntegrity, countOrphanOkrsky } from "../../src/migration/self-check";
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

  test("MI09: flags an okrsek without a def point", () => {
    const d = base();
    d.defBody = d.defBody.slice(0, 1);
    expect(checkIntegrity(d).some((p) => p.includes("MI09") && p.includes("no def point"))).toBe(true);
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

  test("MI01: flags an OBEC_KOD not in the supplied obec registry", () => {
    const d = base();
    expect(
      checkIntegrity(d, { knownObecKods: new Set([999999]) }).some((p) =>
        p.includes("MI01") && p.includes("not in obec registry")
      )
    ).toBe(true);
    // with the real code present, MI01 passes
    expect(
      checkIntegrity(d, { knownObecKods: new Set([500001]) }).some((p) => p.includes("MI01"))
    ).toBe(false);
  });

  test("MI02: flags a KO↔ŠO link whose types differ", () => {
    const d = base();
    d.okrsky[0].TYP_OBVODU_KOD = "M";
    expect(checkIntegrity(d).some((p) => p.includes("MI02") && p.includes("type mismatch"))).toBe(true);
  });

  test("MI02: an orphan okrsek is NOT an error (ČÚZK relaxation); countOrphanOkrsky reports it", () => {
    const d = base();
    d.skoKo = d.skoKo.filter((l) => l.KO_KOD !== 100002); // okrsek 100002 now orphan
    expect(checkIntegrity(d).some((p) => p.includes("MI02"))).toBe(false);
    expect(countOrphanOkrsky(d)).toBe(1);
  });

  test("MI03: flags a MIG_SKO_KO link to a non-existent okrsek", () => {
    const d = base();
    d.skoKo.push({ SKO_KOD: 10001, KO_KOD: 888888 });
    expect(checkIntegrity(d).some((p) => p.includes("MI03") && p.includes("888888"))).toBe(true);
  });

  test("MI04: flags an obvod with no okrsek and no whole-obec coverage", () => {
    const d = base();
    d.skoKo = [];
    expect(checkIntegrity(d).some((p) => p.includes("MI04 risk"))).toBe(true);
  });

  test("MI04: accepts a whole-obec obvod with no okrsek", () => {
    const d = base();
    d.skoKo = [];
    d.vymezeni = [{ OBEC_KOD: 500001, SKO_KOD: 10001 }];
    expect(checkIntegrity(d).some((p) => p.includes("MI04 risk"))).toBe(false);
  });

  test("MI05: flags a dangling SKO_KOD in MIG_SKO_KO and in vymezeni", () => {
    const d = base();
    d.skoKo.push({ SKO_KOD: 99999, KO_KOD: 100001 });
    expect(checkIntegrity(d).some((p) => p.includes("MI05") && p.includes("unknown SKO_KOD 99999"))).toBe(true);

    const e = base();
    e.vymezeni = [{ OBEC_KOD: 555000, SKO_KOD: 77777 }];
    expect(checkIntegrity(e).some((p) => p.includes("MI05") && p.includes("77777"))).toBe(true);
  });

  test("MI06: flags an obvod with no MIG_SKOLA_SKO school link", () => {
    const d = base();
    d.skolaSko = [];
    expect(checkIntegrity(d).some((p) => p.includes("MI06"))).toBe(true);
  });

  test("MI07: flags a SKOLA_IZO absent from the supplied registry", () => {
    const d = base();
    expect(
      checkIntegrity(d, { knownIzos: new Set([600001111]) }).some((p) => p.includes("MI07"))
    ).toBe(false);
    expect(
      checkIntegrity(d, { knownIzos: new Set([111111111]) }).some((p) =>
        p.includes("MI07") && p.includes("600001111")
      )
    ).toBe(true);
  });

  test("MI08: flags a def point / seam referencing a non-existent okrsek", () => {
    const d = base();
    d.defBody[0].KO_KOD = 777777;
    expect(checkIntegrity(d).some((p) => p.includes("MI08") && p.includes("MIG_DEF_BOD_KO"))).toBe(true);

    const e = base();
    e.hrany[0].KO_KOD1 = 777777;
    expect(checkIntegrity(e).some((p) => p.includes("MI08") && p.includes("MIG_HRAN_KO"))).toBe(true);
  });

  test("MI11: flags a trivial obec (obvod, no okrsek) with no whole-obec coverage", () => {
    const d = base();
    d.okrsky = [];
    d.skoKo = [];
    d.defBody = [];
    d.hrany = [];
    // obvod 10001 of type 1 exists but nothing covers obec 500001 -> MI11
    expect(checkIntegrity(d).some((p) => p.includes("MI11"))).toBe(true);
    d.vymezeni = [{ OBEC_KOD: 500001, SKO_KOD: 10001 }];
    expect(checkIntegrity(d).some((p) => p.includes("MI11"))).toBe(false);
  });

  test("MI12: flags two same-type ŠO with identical schools + grade ranges", () => {
    const d = base();
    // a second obvod, same type, same single school + identical TRIDA flags
    d.obvody.push({ KOD: 10002, NAZEV: null, POZNAMKA: null, OBEC_KOD: 500001, TYP_OBVODU_KOD: "1" });
    d.skolaSko.push({ ...d.skolaSko[0], SKO_KOD: 10002 });
    d.vymezeni = [{ OBEC_KOD: 500001, SKO_KOD: 10002 }]; // cover the new obvod (dodge MI04)
    expect(checkIntegrity(d).some((p) => p.includes("MI12"))).toBe(true);
  });

  test("MI13: flags a grade flag outside the obvod's type band", () => {
    const d = base();
    d.skolaSko[0].TRIDA_6 = "A"; // a type-1 obvod must not flag grade 6
    expect(checkIntegrity(d).some((p) => p.includes("MI13"))).toBe(true);
  });

  test("MI13: accepts 2.stupeň grade flags on a type-2 obvod", () => {
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

  test("MI14: flags two same-type ŠO linked to an identical okrsek set", () => {
    const d = base();
    d.obvody.push({ KOD: 10002, NAZEV: null, POZNAMKA: null, OBEC_KOD: 500001, TYP_OBVODU_KOD: "1" });
    d.skolaSko.push({ ...d.skolaSko[0], SKO_KOD: 10002, SKOLA_IZO: 600002222 });
    // second obvod links exactly the same okrsky as the first
    d.skoKo.push({ SKO_KOD: 10002, KO_KOD: 100001 }, { SKO_KOD: 10002, KO_KOD: 100002 });
    expect(checkIntegrity(d).some((p) => p.includes("MI14"))).toBe(true);
  });

  test("flags a self-referential seam (MI10 precondition)", () => {
    const d = base();
    d.hrany[0].KO_KOD2 = d.hrany[0].KO_KOD1;
    expect(checkIntegrity(d).some((p) => p.includes("self-seam"))).toBe(true);
  });

  test("flags a duplicate obvod KOD (allocator regression)", () => {
    const d = base();
    d.obvody.push({ ...d.obvody[0] });
    expect(checkIntegrity(d).some((p) => p.includes("duplicate obvod KOD"))).toBe(true);
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
