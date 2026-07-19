import { Feature, MultiPolygon, Polygon } from "@turf/helpers";
import {
  assignOkrsekNumbers,
  buildLabeledCells,
  deriveSeams,
  dissolveAreaSetComponents,
  mergeEmptyFragments,
  selectDefPoints,
} from "../street-markdown/polygons";
import { Area, Municipality } from "../street-markdown/types";
import {
  MigSkolaSko,
  MigSkolskyObvod,
  MigSkolskyOkrsek,
  MigSkoKo,
  ObecTables,
  SchoolGrades,
  SchoolTypeCode,
  TridaFlag,
} from "./types";

/** Global, deterministic code/id allocators + grade lookup for one migration run. */
export interface ObecBuildContext {
  obecKod: number;
  typeCode: SchoolTypeCode;
  /** next unique MIG_SKOLSKY_OBVOD.KOD (5-digit space) */
  allocObvodKod: () => number;
  /** next unique MIG_SKOLSKY_OKRSEK.KOD (6-digit space) */
  allocOkrsekKod: () => number;
  /** next unique id for MIG_DEF_BOD_KO / MIG_HRAN_KO */
  allocId: () => number;
  /** grades a school teaches (from the ČÚZK CSV), or undefined if not listed */
  gradesByIzo: (izo: string) => SchoolGrades | undefined;
}

const GRADE_BANDS: Record<SchoolTypeCode, number[]> = {
  M: [],
  "1": [1, 2, 3, 4, 5],
  "2": [6, 7, 8, 9],
};

/**
 * Assemble every MIG_* row for one obec + type from the parsed catchment areas.
 * Runs the C-1..C-6 geometry pipeline (labeled cells -> area-set atoms ->
 * empty-fragment merge -> okrsky, seams, def points, numbering) and joins it to
 * the obvod/škola relational rows. Obvody and okrsky are ordered by stable,
 * content-derived keys so the KOD/CISLO the allocators hand out are deterministic
 * for unchanged input.
 *
 * `boundary` is the clip boundary for this unit — the *district* boundary for the
 * big cities (§7), the obec boundary otherwise.
 */
export const buildObecTables = (
  municipality: Municipality,
  boundary: Feature<Polygon | MultiPolygon>,
  ctx: ObecBuildContext
): ObecTables => {
  const areas = municipality.areas;

  // --- obvody (one per area), numbered in a stable order, + škola rows
  const obvody: MigSkolskyObvod[] = [];
  const skolaSko: MigSkolaSko[] = [];
  const obvodKodByAreaIndex = new Map<number, number>();

  const orderedAreas = [...areas].sort((a, b) =>
    obvodKey(a).localeCompare(obvodKey(b))
  );
  for (const area of orderedAreas) {
    const kod = ctx.allocObvodKod();
    obvodKodByAreaIndex.set(area.index, kod);
    obvody.push({
      KOD: kod,
      NAZEV: null,
      POZNAMKA: null,
      OBEC_KOD: ctx.obecKod,
      TYP_OBVODU_KOD: ctx.typeCode,
    });
    for (const school of area.schools) {
      skolaSko.push(
        buildSkolaSko(kod, school.izo, ctx.gradesByIzo(school.izo), ctx.typeCode)
      );
    }
  }

  // --- geometry pipeline -> okrsky (C-1..C-3)
  const cells = buildLabeledCells(areas);
  const okrsky = mergeEmptyFragments(
    dissolveAreaSetComponents(cells, boundary)
  );

  // --- okrsek KOD + CISLO, allocated in CISLO order (C-6)
  const okrsekKodByKo = new Map<number, number>();
  const okrskyRows: MigSkolskyOkrsek[] = [];
  const numbered = assignOkrsekNumbers(okrsky).sort(
    (a, b) => a.cislo - b.cislo
  );
  for (const { ko, cislo } of numbered) {
    const kod = ctx.allocOkrsekKod();
    okrsekKodByKo.set(ko, kod);
    okrskyRows.push({
      KOD: kod,
      KOD_ISUI: null,
      NAZEV: null,
      CISLO: cislo,
      POZNAMKA: null,
      OBEC_KOD: ctx.obecKod,
      TYP_OBVODU_KOD: ctx.typeCode,
    });
  }

  // --- MIG_SKO_KO: each okrsek links to every obvod in its area-set
  const skoKo: MigSkoKo[] = [];
  okrsky.forEach((okrsek, ko) => {
    const koKod = okrsekKodByKo.get(ko)!;
    for (const areaIndex of okrsek.areaIndexes) {
      const skoKod = obvodKodByAreaIndex.get(areaIndex);
      if (skoKod !== undefined) {
        skoKo.push({ SKO_KOD: skoKod, KO_KOD: koKod });
      }
    }
  });

  // --- def points (C-5) + seams (C-4)
  const defBody = selectDefPoints(okrsky).map(({ ko, point }) => ({
    ID: ctx.allocId(),
    KO_KOD: okrsekKodByKo.get(ko)!,
    geometry: point.geometry,
  }));

  const hrany = deriveSeams(okrsky.map((o) => o.polygon)).map((seam) => ({
    ID: ctx.allocId(),
    KO_KOD1: okrsekKodByKo.get(seam.ko1)!,
    KO_KOD2: okrsekKodByKo.get(seam.ko2)!,
    geometry: seam.line.geometry,
  }));

  return { obvody, okrsky: okrskyRows, skoKo, defBody, hrany, skolaSko };
};

/** Stable, content-derived key for ordering obvody (sorted school IZOs). */
const obvodKey = (area: Area): string =>
  area.schools
    .map((s) => s.izo)
    .sort()
    .join(",");

const buildSkolaSko = (
  skoKod: number,
  izo: string,
  grades: SchoolGrades | undefined,
  type: SchoolTypeCode
): MigSkolaSko => {
  const band = GRADE_BANDS[type];
  const flag = (grade: number): TridaFlag =>
    band.includes(grade) &&
    (grades ? grades[`t${grade}` as keyof SchoolGrades] : true)
      ? "A"
      : "N";
  return {
    SKO_KOD: skoKod,
    SKOLA_IZO: Number(izo),
    TRIDA_1: flag(1),
    TRIDA_2: flag(2),
    TRIDA_3: flag(3),
    TRIDA_4: flag(4),
    TRIDA_5: flag(5),
    TRIDA_6: flag(6),
    TRIDA_7: flag(7),
    TRIDA_8: flag(8),
    TRIDA_9: flag(9),
  };
};

/** Simple monotonic id/code allocator starting at `start`. */
export const counter = (start: number): (() => number) => {
  let next = start;
  return () => next++;
};
