import { describe, expect, test } from "@jest/globals";
import { dedupeExport } from "../../src/migration/dedupe";
import { MigrationExport, MigSkolaSko } from "../../src/migration/types";

const skolaSko = (skoKod: number, izo: number): MigSkolaSko => ({
  SKO_KOD: skoKod,
  SKOLA_IZO: izo,
  TRIDA_1: "A", TRIDA_2: "A", TRIDA_3: "A", TRIDA_4: "A", TRIDA_5: "A",
  TRIDA_6: "N", TRIDA_7: "N", TRIDA_8: "N", TRIDA_9: "N",
});

const empty = (): MigrationExport => ({
  obvody: [],
  okrsky: [],
  skoKo: [],
  defBody: [],
  hrany: [],
  skolaSko: [],
  vymezeni: [],
});

describe("dedupeExport", () => {
  test("collapses duplicate join/attribute rows, first occurrence wins", () => {
    const data: MigrationExport = {
      ...empty(),
      skoKo: [
        { SKO_KOD: 1, KO_KOD: 10 },
        { SKO_KOD: 1, KO_KOD: 10 }, // dup
        { SKO_KOD: 1, KO_KOD: 11 },
      ],
      skolaSko: [
        skolaSko(1, 600001),
        skolaSko(1, 600001), // dup (same school on two ordinance lines)
        skolaSko(2, 600002),
      ],
      vymezeni: [
        { OBEC_KOD: 500, SKO_KOD: 1 },
        { OBEC_KOD: 500, SKO_KOD: 1 }, // dup
      ],
    };

    const out = dedupeExport(data);
    expect(out.skoKo).toEqual([
      { SKO_KOD: 1, KO_KOD: 10 },
      { SKO_KOD: 1, KO_KOD: 11 },
    ]);
    expect(out.skolaSko).toHaveLength(2);
    expect(out.vymezeni).toEqual([{ OBEC_KOD: 500, SKO_KOD: 1 }]);
  });

  test("leaves distinct rows and code-keyed tables untouched", () => {
    const data: MigrationExport = {
      ...empty(),
      obvody: [
        { KOD: 1, NAZEV: null, POZNAMKA: null, OBEC_KOD: 500, TYP_OBVODU_KOD: "1" },
        { KOD: 2, NAZEV: null, POZNAMKA: null, OBEC_KOD: 500, TYP_OBVODU_KOD: "1" },
      ],
      skoKo: [
        { SKO_KOD: 1, KO_KOD: 10 },
        { SKO_KOD: 2, KO_KOD: 10 },
      ],
    };
    expect(dedupeExport(data)).toEqual(data);
  });
});
