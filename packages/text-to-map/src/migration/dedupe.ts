import { MigrationExport } from "./types";

/**
 * B5 — collapse exact-duplicate rows in the join / attribute tables so the
 * duplicate-row validations (MI12 / MI14) can't fire on handover.
 *
 * Only the many-to-many and attribute tables can legitimately produce repeats
 * (e.g. the same school listed on two ordinance lines merged into one area →
 * two identical `MIG_SKOLA_SKO` rows; a whole-obec obec whose coverage is
 * asserted twice). The code-keyed tables (obvody, okrsky, def points, seams)
 * carry allocator-unique KOD/ID, so a repeat there would be a bug we'd rather
 * surface than silently swallow — they're left untouched.
 *
 * First occurrence wins; row order is otherwise preserved (deterministic).
 */
export const dedupeExport = (data: MigrationExport): MigrationExport => ({
  ...data,
  skoKo: dedupeBy(data.skoKo, (r) => `${r.SKO_KOD}/${r.KO_KOD}`),
  skolaSko: dedupeBy(data.skolaSko, (r) => `${r.SKO_KOD}/${r.SKOLA_IZO}`),
  vymezeni: dedupeBy(data.vymezeni, (r) => `${r.OBEC_KOD}/${r.SKO_KOD}`),
});

const dedupeBy = <T>(rows: T[], key: (row: T) => string): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const k = key(row);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(row);
  }
  return out;
};
