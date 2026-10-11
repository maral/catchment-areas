import { describe, expect, test } from "@jest/globals";
import { Feature, MultiPolygon, Polygon } from "@turf/helpers";
import { checkSeamTopology } from "../../src/migration/topology-check";
import { MigrationExport } from "../../src/migration/types";

const B = (x: number, y: number): number[] => [14.4 + x * 0.01, 50.0 + y * 0.01];

const square: Feature<Polygon> = {
  type: "Feature",
  properties: {},
  geometry: { type: "Polygon", coordinates: [[B(0, 0), B(10, 0), B(10, 10), B(0, 10), B(0, 0)]] },
};

const okrsek = (KOD: number) => ({
  KOD, KOD_ISUI: null, NAZEV: null, CISLO: KOD, POZNAMKA: null, OBEC_KOD: 500001, TYP_OBVODU_KOD: "1" as const,
});
const seam = (KO_KOD1: number, KO_KOD2: number, coords: number[][]) => ({
  ID: KO_KOD1 * 100 + KO_KOD2, KO_KOD1, KO_KOD2, geometry: { type: "LineString" as const, coordinates: coords },
});
const def = (KO_KOD: number, x: number, y: number) => ({
  ID: KO_KOD, KO_KOD, geometry: { type: "Point" as const, coordinates: B(x, y) },
});
const exportOf = (parts: Partial<MigrationExport>): MigrationExport => ({
  obvody: [], okrsky: [], skoKo: [], defBody: [], hrany: [], skolaSko: [], vymezeni: [], ...parts,
});
const boundaries = (b: Feature<Polygon | MultiPolygon>) => new Map([[500001, b]]);

describe("checkSeamTopology (local MI10)", () => {
  // three okrsky: left half 1, right half split into 2 (bottom) / 3 (top)
  const valid = exportOf({
    okrsky: [okrsek(1), okrsek(2), okrsek(3)],
    hrany: [
      seam(1, 2, [B(5, 0), B(5, 5)]),
      seam(1, 3, [B(5, 5), B(5, 10)]),
      seam(2, 3, [B(5, 5), B(10, 5)]),
    ],
    defBody: [def(1, 2, 5), def(2, 8, 2), def(3, 8, 8)],
  });

  test("a closed network passes", () => {
    expect(checkSeamTopology(valid, boundaries(square))).toEqual([]);
  });

  test("a missing district-line seam shows as a broken junction", () => {
    const broken = { ...valid, hrany: valid.hrany.filter((h) => h.KO_KOD2 !== 3 || h.KO_KOD1 !== 1) };
    const problems = checkSeamTopology(broken, boundaries(square));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/okrsky 1, 3 are missing a seam/);
  });

  test("a seam ending in the open is dangling", () => {
    const dangling = exportOf({
      okrsky: [okrsek(1), okrsek(2)],
      hrany: [seam(1, 2, [B(5, 0), B(5, 7)])],
      defBody: [def(1, 2, 5), def(2, 8, 5)],
    });
    const problems = checkSeamTopology(dangling, boundaries(square));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/seam 1\|2 ends at .* without meeting/);
  });

  test("an exclave with no def point is reported; a hole is not", () => {
    const withExclave: Feature<MultiPolygon> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [square.geometry.coordinates[0], [B(1, 1), B(2, 1), B(2, 2), B(1, 2), B(1, 1)]],
          [[B(12, 0), B(14, 0), B(14, 2), B(12, 2), B(12, 0)]],
        ],
      },
    };
    const problems = checkSeamTopology(valid, boundaries(withExclave));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/boundary part 2 .* has no def point/);

    const covered = { ...valid, defBody: [...valid.defBody, def(3, 13, 1)] };
    expect(checkSeamTopology(covered, boundaries(withExclave))).toEqual([]);
  });
});
