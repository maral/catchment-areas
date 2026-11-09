import { getKnexDb } from "../db/db";
import {
  deleteMapData,
  getLatestStreetMarkdowns,
  getSchoolCandidatesByCity,
  saveStreetMarkdownEdits,
  StreetMarkdownLineEdit,
} from "../db/street-markdowns";
import { SchoolType } from "../db/types";

/** A school whose registry name changed in this sync. */
export interface SchoolRename {
  izo: string;
  type: SchoolType;
  oldName: string;
  newName: string;
}

export interface SchoolRenameResult {
  /** street markdowns saved with the new names */
  rewritten: { founderId: number; ordinanceId: number; lines: number }[];
  /** renames not applied: the old name is still another school's in that city */
  ambiguous: SchoolRename[];
  /** cached maps dropped (rebuilt on the next view) */
  mapDataDeleted: number;
}

/**
 * Carry registry renames into the street markdowns: a line naming a school by
 * its old name would otherwise resolve to the *closest* current name — another
 * school, often. Every current street markdown of a still-valid ordinance in
 * the school's city that has the old name as a line gets it replaced, saved as
 * a new version. Maps listing the school are dropped from the cache so they
 * show the new name. Exact names only: a line that already didn't match is
 * left for the editor to fix.
 */
export const rewriteRenamedSchools = async (
  renames: SchoolRename[]
): Promise<SchoolRenameResult> => {
  const result: SchoolRenameResult = { rewritten: [], ambiguous: [], mapDataDeleted: 0 };
  if (renames.length === 0) return result;
  const knex = getKnexDb();

  const cityRows = await knex("school_founder as sf")
    .join("founder as f", "f.id", "sf.founder_id")
    .whereIn("sf.school_izo", renames.map((r) => r.izo))
    .distinct("sf.school_izo as izo", "f.city_code as cityCode");
  const citiesByIzo = new Map<string, Set<number>>();
  for (const r of cityRows) {
    const set = citiesByIzo.get(String(r.izo)) ?? new Set<number>();
    set.add(Number(r.cityCode));
    citiesByIzo.set(String(r.izo), set);
  }
  const allCities = [...new Set(cityRows.map((r: any) => Number(r.cityCode)))];

  const today = new Date().toISOString().slice(0, 10);
  const ordinanceIds = (
    await knex("ordinance")
      .whereIn("city_code", allCities)
      .where((q) => q.whereNull("valid_to").orWhere("valid_to", ">=", today))
      .select("id")
  ).map((r: any) => Number(r.id));
  const smds = await getLatestStreetMarkdowns(ordinanceIds);

  // a city's schools after the update: the old name must not still be another's
  const candidates = new Map<SchoolType, Map<number, { izo: string; name: string }[]>>();
  for (const type of [SchoolType.Kindergarten, SchoolType.Elementary]) {
    candidates.set(type, await getSchoolCandidatesByCity(allCities, type));
  }
  const isAmbiguous = (rename: SchoolRename, cityCode: number) =>
    (candidates.get(rename.type)?.get(cityCode) ?? []).some(
      (s) => s.izo !== rename.izo && s.name === rename.oldName
    );

  // first: rewriting a street markdown drops its ordinance's maps uncounted
  for (const rename of renames) {
    result.mapDataDeleted += await deleteMapData({ schoolIzo: rename.izo });
  }

  const ambiguous = new Set<SchoolRename>();
  for (const smd of smds) {
    const edits: StreetMarkdownLineEdit[] = [];
    const applied: SchoolRename[] = [];
    const lines = smd.sourceText.split("\n");
    for (const rename of renames) {
      if (rename.type !== smd.schoolType) continue;
      if (!citiesByIzo.get(rename.izo)?.has(smd.cityCode)) continue;
      const hits = lines.flatMap((line, i) =>
        line.trim() === rename.oldName ? [i + 1] : []
      );
      if (hits.length === 0) continue;
      if (isAmbiguous(rename, smd.cityCode)) {
        ambiguous.add(rename);
        continue;
      }
      applied.push(rename);
      for (const lineNumber of hits) {
        edits.push({ lineNumber, from: rename.oldName, to: rename.newName });
      }
    }
    if (edits.length === 0) continue;
    const comment = `Automatická úprava: přejmenování ${
      applied.length === 1 ? "školy" : "škol"
    } podle rejstříku (${applied
      .map((r) => `„${r.oldName}“ → „${r.newName}“`)
      .join(", ")})`;
    await saveStreetMarkdownEdits(smd, edits, comment);
    result.rewritten.push({
      founderId: smd.founderId,
      ordinanceId: smd.ordinanceId,
      lines: edits.length,
    });
  }

  result.ambiguous = [...ambiguous];
  return result;
};
