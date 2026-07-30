import { SchoolTypeCode, TridaFlag, MigrationExport } from "./types";

/**
 * Self-check harness (F1): the referential / cardinality / attribute invariants
 * of the CR0025 MI01–MI14 rules that we can verify on **our** side, before
 * handover, over a {@link MigrationExport}. Each check is tagged with the MI rule
 * it stands in for.
 *
 * What stays ČÚZK's responsibility (not checkable here): **MI10** — the geometric
 * reassembly of okrsek polygons into a gap-free whole-obec cover — runs on their
 * load from the `MIG_HRAN_KO` seams + obec boundary, geometry we intentionally do
 * not hold. We assert the *combinatorial* preconditions for it (coverage, seam and
 * def-point integrity, no degenerate geometry) so a failure there is theirs, not
 * ours.
 *
 * Returns a list of human-readable problems; empty means the checks passed.
 */
export const checkIntegrity = (data: MigrationExport): string[] => {
  const problems: string[] = [];

  const obvodKods = new Set(data.obvody.map((o) => o.KOD));
  const okrsekKods = new Set(data.okrsky.map((o) => o.KOD));
  const okrsekType = new Map(data.okrsky.map((o) => [o.KOD, o.TYP_OBVODU_KOD]));
  const obvodType = new Map(data.obvody.map((o) => [o.KOD, o.TYP_OBVODU_KOD]));

  // --- Code uniqueness: KOD is minted deterministically, so a collision means a
  // bug in the allocators (shared-allocator regression). Obvod and okrsek codes
  // live in disjoint spaces (5- vs 6-digit) and are checked independently.
  for (const [label, kods] of [
    ["obvod", data.obvody.map((o) => o.KOD)] as const,
    ["okrsek", data.okrsky.map((o) => o.KOD)] as const,
  ]) {
    const seen = new Set<number>();
    for (const kod of kods) {
      if (seen.has(kod)) problems.push(`duplicate ${label} KOD ${kod}`);
      seen.add(kod);
    }
  }

  // --- MI09: exactly one def point per okrsek; every def point references an
  // existing okrsek with a finite coordinate (F3 geometry data-quality).
  const defByKo = new Map<number, number>();
  for (const d of data.defBody) {
    defByKo.set(d.KO_KOD, (defByKo.get(d.KO_KOD) ?? 0) + 1);
    if (!okrsekKods.has(d.KO_KOD)) {
      problems.push(`MIG_DEF_BOD_KO ${d.ID}: unknown KO_KOD ${d.KO_KOD}`);
    }
    if (!isFiniteCoord(d.geometry.coordinates)) {
      problems.push(`MIG_DEF_BOD_KO ${d.ID}: non-finite coordinate`);
    }
  }
  for (const kod of okrsekKods) {
    const n = defByKo.get(kod) ?? 0;
    if (n !== 1) {
      problems.push(`okrsek ${kod}: expected 1 def point, found ${n}`);
    }
  }

  // --- CISLO unique within an obec + type (M / 1 / 2 are independent okrsek sets).
  const cisloSeen = new Set<string>();
  for (const o of data.okrsky) {
    const key = `${o.OBEC_KOD}/${o.TYP_OBVODU_KOD}/${o.CISLO}`;
    if (cisloSeen.has(key)) {
      problems.push(
        `duplicate CISLO ${o.CISLO} in obec ${o.OBEC_KOD} type ${o.TYP_OBVODU_KOD}`
      );
    }
    cisloSeen.add(key);
  }

  // --- MI02: MIG_SKO_KO references resolve, and okrsek type matches obvod type.
  // MI14: no duplicate (SKO_KOD, KO_KOD) link rows (dedupe should have collapsed
  // them; a survivor means a bug upstream of the writer).
  const skoKoSeen = new Set<string>();
  for (const link of data.skoKo) {
    if (!obvodKods.has(link.SKO_KOD)) {
      problems.push(`MIG_SKO_KO: unknown SKO_KOD ${link.SKO_KOD}`);
    }
    if (!okrsekKods.has(link.KO_KOD)) {
      problems.push(`MIG_SKO_KO: unknown KO_KOD ${link.KO_KOD}`);
    }
    const ot = obvodType.get(link.SKO_KOD);
    const kt = okrsekType.get(link.KO_KOD);
    if (ot && kt && ot !== kt) {
      problems.push(
        `MIG_SKO_KO: type mismatch obvod ${link.SKO_KOD} (${ot}) vs okrsek ${link.KO_KOD} (${kt})`
      );
    }
    const key = `${link.SKO_KOD}/${link.KO_KOD}`;
    if (skoKoSeen.has(key)) {
      problems.push(`MI14: duplicate MIG_SKO_KO row ${key}`);
    }
    skoKoSeen.add(key);
  }

  // --- MI04: every obvod is linked to at least one okrsek OR covered whole-obec
  // (a trivial-obec / absorbed-village MIG_VYMEZENI_ZBYLYCH_KO row). MI11: each
  // vymezeni row with a school points at an existing obvod of this run.
  const wholeObecObvody = new Set(
    data.vymezeni.map((v) => v.SKO_KOD).filter((k): k is number => k !== null)
  );
  const linkedObvody = new Set(data.skoKo.map((l) => l.SKO_KOD));
  for (const kod of obvodKods) {
    if (!linkedObvody.has(kod) && !wholeObecObvody.has(kod)) {
      problems.push(`obvod ${kod}: no okrsek and no whole-obec vymezeni (MI04 risk)`);
    }
  }
  const vymezeniSeen = new Set<string>();
  for (const v of data.vymezeni) {
    if (v.SKO_KOD !== null && !obvodKods.has(v.SKO_KOD)) {
      problems.push(`MIG_VYMEZENI_ZBYLYCH_KO: unknown SKO_KOD ${v.SKO_KOD}`);
    }
    // MI12: no duplicate (OBEC_KOD, SKO_KOD) coverage rows.
    const key = `${v.OBEC_KOD}/${v.SKO_KOD}`;
    if (vymezeniSeen.has(key)) {
      problems.push(`MI12: duplicate MIG_VYMEZENI_ZBYLYCH_KO row ${key}`);
    }
    vymezeniSeen.add(key);
  }

  // --- Seams (MI10 precondition): reference two distinct existing okrsky, with a
  // non-degenerate linestring (≥2 finite points). ČÚZK reassembles the obec cover
  // from these; a self-seam or a broken geometry would corrupt that.
  for (const h of data.hrany) {
    if (h.KO_KOD1 === h.KO_KOD2) {
      problems.push(`MIG_HRAN_KO ${h.ID}: self-seam ${h.KO_KOD1}`);
    }
    for (const k of [h.KO_KOD1, h.KO_KOD2]) {
      if (!okrsekKods.has(k)) {
        problems.push(`MIG_HRAN_KO ${h.ID}: unknown okrsek ${k}`);
      }
    }
    const coords = h.geometry.coordinates;
    if (coords.length < 2 || !coords.every(isFiniteCoord)) {
      problems.push(`MIG_HRAN_KO ${h.ID}: degenerate geometry`);
    }
  }

  // --- MIG_SKOLA_SKO: references an existing obvod; grade flags stay inside the
  // obvod's type band (MI13); no duplicate (SKO_KOD, SKOLA_IZO) rows (MI14).
  const skolaSkoSeen = new Set<string>();
  for (const s of data.skolaSko) {
    if (!obvodKods.has(s.SKO_KOD)) {
      problems.push(`MIG_SKOLA_SKO: unknown SKO_KOD ${s.SKO_KOD}`);
    }
    const type = obvodType.get(s.SKO_KOD);
    if (type) {
      const band = TYPE_BANDS[type];
      for (let grade = 1; grade <= 9; grade++) {
        const flag = s[`TRIDA_${grade}` as keyof typeof s] as TridaFlag;
        if (flag === "A" && !band.includes(grade)) {
          problems.push(
            `MI13: MIG_SKOLA_SKO ${s.SKO_KOD}/${s.SKOLA_IZO} flags grade ${grade} outside type ${type} band`
          );
        }
      }
    }
    const key = `${s.SKO_KOD}/${s.SKOLA_IZO}`;
    if (skolaSkoSeen.has(key)) {
      problems.push(`MI14: duplicate MIG_SKOLA_SKO row ${key}`);
    }
    skolaSkoSeen.add(key);
  }

  return problems;
};

/** Grades a MIG_SKOLA_SKO row of a given obvod type may flag `A` (MI13). */
const TYPE_BANDS: Record<SchoolTypeCode, number[]> = {
  M: [],
  "1": [1, 2, 3, 4, 5],
  "2": [6, 7, 8, 9],
};

const isFiniteCoord = (coord: number[]): boolean =>
  coord.length >= 2 && coord.every((n) => Number.isFinite(n));
