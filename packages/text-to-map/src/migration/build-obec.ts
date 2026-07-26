import { Feature, MultiPolygon, Polygon } from "@turf/helpers";
import {
  AreaSetComponent,
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
  MigVymezeniZbylychKo,
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
 * Does a school teach any 2.stupeň grade (6–9)? Used to decide whether a type-`2`
 * ŠO is created (E2/E3). Unknown schools (not in the ČÚZK CSV) are assumed to have
 * 2.stupeň, matching the full-band default in `buildSkolaSko`.
 */
const hasSecondStage = (
  izo: string,
  gradesByIzo: (izo: string) => SchoolGrades | undefined
): boolean => {
  const grades = gradesByIzo(izo);
  if (!grades) return true;
  return GRADE_BANDS["2"].some((g) => grades[`t${g}` as keyof SchoolGrades]);
};

/** One Voronoi input: a set of areas clipped to a single boundary. */
export interface DistrictInput {
  areas: Area[];
  boundary: Feature<Polygon | MultiPolygon>;
}

/**
 * Assemble every MIG_* row for one obec + type from the parsed catchment areas.
 * Runs the C-1..C-6 geometry pipeline (labeled cells -> area-set atoms ->
 * empty-fragment merge -> okrsky, seams, def points, numbering) and joins it to
 * the obvod/škola relational rows.
 *
 * `boundary` is the clip boundary — the obec boundary for a normal obec. The
 * district-first big cities go through {@link buildPooledObecTables} directly
 * with one district input per městská část (P4-3).
 */
export const buildObecTables = (
  municipality: Municipality,
  boundary: Feature<Polygon | MultiPolygon>,
  ctx: ObecBuildContext
): ObecTables =>
  buildPooledObecTables(
    ctx.obecKod,
    ctx.typeCode,
    municipality.areas,
    [{ areas: municipality.areas, boundary }],
    ctx
  );

/**
 * The general obec assembler: one set of `allAreas` (the obvody/ŠO/škola rows)
 * plus one or more `districtInputs` (each a Voronoi over some areas clipped to a
 * boundary). A normal obec passes a single district input; a big city passes one
 * per městská část, all pooled into this obec. Okrsky from every district input
 * are concatenated — since seam/def/numbering key off array position, this yields
 * cross-district seams and one continuous CISLO numbering for free.
 *
 * `allAreas` carry global indexes; an area's okrsky in any district link to that
 * area's single obvod, so a school whose catchment spans districts shares one ŠO.
 * Obvody/okrsky are ordered by stable content-derived keys for determinism.
 */
export const buildPooledObecTables = (
  obecKod: number,
  typeCode: SchoolTypeCode,
  allAreas: Area[],
  districtInputs: DistrictInput[],
  ctx: ObecBuildContext
): ObecTables => {
  // --- obvody (one per area), numbered in a stable order, + škola rows
  const obvody: MigSkolskyObvod[] = [];
  const skolaSko: MigSkolaSko[] = [];
  const obvodKodByAreaIndex = new Map<number, number>();
  // whole-village inclusions (§8): each absorbed obec -> this area's ŠO
  const vymezeni: MigVymezeniZbylychKo[] = [];

  // For type `2`, a ŠO exists only where a school teaches 2.stupeň (E2); okrsky
  // of the others stay orphan (E3). Types `1`/`M` include every school.
  const includeSchool = (izo: string): boolean =>
    typeCode !== "2" || hasSecondStage(izo, ctx.gradesByIzo);

  const orderedAreas = [...allAreas].sort((a, b) =>
    obvodKey(a).localeCompare(obvodKey(b))
  );
  for (const area of orderedAreas) {
    const includedSchools = area.schools.filter((s) => includeSchool(s.izo));
    if (includedSchools.length === 0) continue; // type-2: no ŠO -> orphan okrsek

    const kod = ctx.allocObvodKod();
    obvodKodByAreaIndex.set(area.index, kod);
    obvody.push({
      KOD: kod,
      NAZEV: null,
      POZNAMKA: null,
      OBEC_KOD: obecKod,
      TYP_OBVODU_KOD: typeCode,
    });
    for (const school of includedSchools) {
      skolaSko.push(
        buildSkolaSko(kod, school.izo, ctx.gradesByIzo(school.izo), typeCode)
      );
    }
    for (const absorbedObecKod of area.absorbedWholeObce ?? []) {
      vymezeni.push({ OBEC_KOD: absorbedObecKod, SKO_KOD: kod });
    }
  }

  // --- trivial obec (B3): one area = whole obec. No tessellation — the whole
  // obec belongs to this single ŠO, expressed as one MIG_VYMEZENI_ZBYLYCH_KO
  // row; ČÚZK generates the whole-obec okrsek and links it. (E4: for type `2`
  // the single school may have no 2.stupeň → SKO_KOD null = orphan whole-obec
  // coverage.) Any absorbed villages carry through too. A big city never hits
  // this (many areas).
  if (allAreas.length === 1) {
    const wholeObecSko = obvody.length > 0 ? obvody[0].KOD : null;
    return {
      obvody,
      okrsky: [],
      skoKo: [],
      defBody: [],
      hrany: [],
      skolaSko,
      vymezeni: [...vymezeni, { OBEC_KOD: obecKod, SKO_KOD: wholeObecSko }],
    };
  }

  // --- geometry pipeline -> okrsky per district input, then combined (C-1..C-3)
  const okrsky: AreaSetComponent[] = [];
  for (const input of districtInputs) {
    const cells = buildLabeledCells(input.areas);
    okrsky.push(
      ...mergeEmptyFragments(dissolveAreaSetComponents(cells, input.boundary))
    );
  }

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
      OBEC_KOD: obecKod,
      TYP_OBVODU_KOD: typeCode,
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

  return {
    obvody,
    okrsky: okrskyRows,
    skoKo,
    defBody,
    hrany,
    skolaSko,
    vymezeni,
  };
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
