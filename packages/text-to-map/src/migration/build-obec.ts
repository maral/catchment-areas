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
  /**
   * First CISLO to hand out for this call (default 1). CR0025 requires okrsek
   * CISLO to be unique within an obec **across all three types**, not just
   * within one type — so a caller building the same obec's M/1/2 types in turn
   * must carry the next free number forward between calls (see
   * `assembleExport`'s `cisloStartByObec`).
   */
  cisloStart?: number;
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
  // --- obvody (one per school circle), numbered in a stable order, + škola rows
  const obvody: MigSkolskyObvod[] = [];
  const skolaSko: MigSkolaSko[] = [];
  const obvodKodByAreaIndex = new Map<number, number>();
  // one ŠO per (obec, type, school circle): areas that share the same set of
  // included schools are the SAME školský obvod — its okrsky are just its
  // several catchment components. Minting a ŠO per area instead would emit
  // duplicate same-school ŠO, which CR0025 MI12 forbids.
  const obvodKodBySchoolSet = new Map<string, number>();
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

    const schoolSetKey = includedSchools
      .map((s) => s.izo)
      .sort()
      .join(",");
    let kod = obvodKodBySchoolSet.get(schoolSetKey);
    if (kod === undefined) {
      kod = ctx.allocObvodKod();
      obvodKodBySchoolSet.set(schoolSetKey, kod);
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
    }
    obvodKodByAreaIndex.set(area.index, kod);
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
  const cisloBase = (ctx.cisloStart ?? 1) - 1;
  for (const { ko, cislo } of numbered) {
    const kod = ctx.allocOkrsekKod();
    okrsekKodByKo.set(ko, kod);
    okrskyRows.push({
      KOD: kod,
      KOD_ISUI: null,
      NAZEV: null,
      CISLO: cislo + cisloBase,
      POZNAMKA: null,
      OBEC_KOD: obecKod,
      TYP_OBVODU_KOD: typeCode,
    });
  }

  // --- MIG_SKO_KO: each okrsek links to every obvod in its area-set. Distinct
  // area-indexes can now map to the same ŠO (merged school circle), so dedupe
  // the links per okrsek.
  const skoKo: MigSkoKo[] = [];
  okrsky.forEach((okrsek, ko) => {
    const koKod = okrsekKodByKo.get(ko)!;
    const linkedSko = new Set<number>();
    for (const areaIndex of okrsek.areaIndexes) {
      const skoKod = obvodKodByAreaIndex.get(areaIndex);
      if (skoKod !== undefined && !linkedSko.has(skoKod)) {
        linkedSko.add(skoKod);
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

  return mergeIdenticalTerritoryObvody({
    obvody,
    okrsky: okrskyRows,
    skoKo,
    defBody,
    hrany,
    skolaSko,
    vymezeni,
  });
};

/**
 * CR0025 **MI14** — two same-type ŠO must not share an identical set of linked
 * okrsky. We mint one ŠO per school circle (set of schools that co-occur in a
 * parsed area), but several circles can still resolve to the *same territory*:
 * every kindergarten in a town serving the whole obec, or two ZŠ sharing an
 * undivided 1./2.stupeň catchment. The geometry then collapses them onto one
 * okrsek set and we end up with several ŠO over identical okrsky. Merge those
 * into a single ŠO that carries all the schools (MIG_SKOLA_SKO), keeping the
 * lowest KOD for determinism and rewriting SKO_KO / vymezeni references.
 *
 * Empty-territory ŠO (no linked okrsek) are left untouched — an empty set is not
 * a shared "vymezení" in MI14's sense; those are an MI04 concern.
 */
const mergeIdenticalTerritoryObvody = (tables: ObecTables): ObecTables => {
  const okrskyByObvod = new Map<number, number[]>();
  for (const l of tables.skoKo) {
    const arr = okrskyByObvod.get(l.SKO_KOD);
    if (arr) arr.push(l.KO_KOD);
    else okrskyByObvod.set(l.SKO_KOD, [l.KO_KOD]);
  }

  const survivorBySig = new Map<string, number>();
  const remap = new Map<number, number>(); // merged ŠO KOD -> survivor KOD
  for (const o of tables.obvody) {
    const kos = okrskyByObvod.get(o.KOD);
    if (!kos || kos.length === 0) continue; // empty ŠO: not MI14
    const sig = `${o.TYP_OBVODU_KOD}|${[...new Set(kos)]
      .sort((a, b) => a - b)
      .join(",")}`;
    const survivor = survivorBySig.get(sig);
    if (survivor === undefined) survivorBySig.set(sig, o.KOD);
    else remap.set(o.KOD, survivor);
  }
  if (remap.size === 0) return tables;

  const to = (kod: number): number => remap.get(kod) ?? kod;
  const obvody = tables.obvody.filter((o) => !remap.has(o.KOD));

  const seenSchool = new Set<string>();
  const skolaSko: MigSkolaSko[] = [];
  for (const s of tables.skolaSko) {
    const skoKod = to(s.SKO_KOD);
    const key = `${skoKod}|${s.SKOLA_IZO}`;
    if (seenSchool.has(key)) continue;
    seenSchool.add(key);
    skolaSko.push({ ...s, SKO_KOD: skoKod });
  }

  const seenLink = new Set<string>();
  const skoKo: MigSkoKo[] = [];
  for (const l of tables.skoKo) {
    const skoKod = to(l.SKO_KOD);
    const key = `${skoKod}|${l.KO_KOD}`;
    if (seenLink.has(key)) continue;
    seenLink.add(key);
    skoKo.push({ SKO_KOD: skoKod, KO_KOD: l.KO_KOD });
  }

  const seenVym = new Set<string>();
  const vymezeni: MigVymezeniZbylychKo[] = [];
  for (const v of tables.vymezeni) {
    const skoKod = v.SKO_KOD === null ? null : to(v.SKO_KOD);
    const key = `${v.OBEC_KOD}|${skoKod}`;
    if (seenVym.has(key)) continue;
    seenVym.add(key);
    vymezeni.push({ OBEC_KOD: v.OBEC_KOD, SKO_KOD: skoKod });
  }

  return { ...tables, obvody, skolaSko, skoKo, vymezeni };
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
