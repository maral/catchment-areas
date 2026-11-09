import {
  findSchoolNameIssues,
  SchoolLine,
  SchoolNameCandidate,
} from "../street-markdown/school-lines";
import { cleanLine } from "../street-markdown/smd";
import { getKnexDb } from "./db";
import { SchoolType } from "./types";

/** The current (latest saved) street markdown of one founder in one ordinance. */
export interface LatestStreetMarkdown {
  id: number;
  founderId: number;
  founderName: string;
  cityCode: number;
  ordinanceId: number;
  schoolType: SchoolType;
  userId: string;
  state: string;
  sourceText: string;
}

/**
 * The latest street markdown per (founder, ordinance) of the given ordinances —
 * the one the editor and the map use (newest `created_at`, `id` breaking ties).
 */
export const getLatestStreetMarkdowns = async (
  ordinanceIds: number[]
): Promise<LatestStreetMarkdown[]> => {
  if (ordinanceIds.length === 0) return [];
  const knex = getKnexDb();
  // pick the ids first: the window over every saved version mustn't drag
  // their texts along
  const ranked = knex("street_markdown")
    .select(
      "id",
      knex.raw(
        "ROW_NUMBER() OVER (PARTITION BY founder_id, ordinance_id ORDER BY created_at DESC, id DESC) AS rn"
      )
    )
    .whereIn("ordinance_id", ordinanceIds);
  const latest = await knex.from(ranked.as("s")).where("rn", 1).select("id");
  const ids = latest.map((r: { id: number }) => r.id);
  if (ids.length === 0) return [];
  const rows = await knex("street_markdown as s")
    .join("founder as f", "f.id", "s.founder_id")
    .join("ordinance as o", "o.id", "s.ordinance_id")
    .whereIn("s.id", ids)
    .select(
      "s.id",
      "s.founder_id as founderId",
      "f.name as founderName",
      "f.city_code as cityCode",
      "s.ordinance_id as ordinanceId",
      "o.school_type as schoolType",
      "s.user_id as userId",
      "s.state",
      "s.source_text as sourceText"
    );
  return rows.map((r: any) => ({
    ...r,
    id: Number(r.id),
    founderId: Number(r.founderId),
    cityCode: Number(r.cityCode),
    ordinanceId: Number(r.ordinanceId),
    schoolType: Number(r.schoolType),
  }));
};

/**
 * The schools a founder's street-markdown lines resolve against, per city and
 * type — every school of that type in the founder's city, as
 * `getSchoolsByCityCode` loads them for the parser.
 */
export const getSchoolCandidatesByCity = async (
  cityCodes: number[],
  schoolType: SchoolType
): Promise<Map<number, SchoolNameCandidate[]>> => {
  const byCity = new Map<number, SchoolNameCandidate[]>();
  if (cityCodes.length === 0) return byCity;
  const rows = await getKnexDb()
    .distinct("f.city_code as cityCode", "s.izo", "s.name")
    .from("school as s")
    .join("school_founder as sf", "s.izo", "sf.school_izo")
    .join("founder as f", "sf.founder_id", "f.id")
    .whereIn("f.city_code", cityCodes)
    .where("s.type", schoolType);
  for (const r of rows) {
    const cityCode = Number(r.cityCode);
    const list = byCity.get(cityCode) ?? [];
    list.push({ izo: String(r.izo), name: String(r.name) });
    byCity.set(cityCode, list);
  }
  return byCity;
};

/** One founder's street markdown with school lines that aren't exact names. */
export interface SchoolNameIssues {
  smd: LatestStreetMarkdown;
  issues: SchoolLine[];
}

/**
 * School-name problems in the current street markdowns of the active
 * ordinances (`is_active`, as the app shows them), optionally of one type.
 * An ordinance served from the city's own geodata has no street markdown.
 */
export const findActiveSchoolNameIssues = async (
  schoolType?: SchoolType
): Promise<SchoolNameIssues[]> => {
  let query = getKnexDb()
    .from("ordinance")
    .where("is_active", true)
    .whereNull("external_data");
  if (schoolType !== undefined) query = query.where("school_type", schoolType);
  const ordinanceIds = (await query.select("id")).map((r: any) => Number(r.id));
  return findSchoolNameIssuesIn(await getLatestStreetMarkdowns(ordinanceIds));
};

export const findSchoolNameIssuesIn = async (
  smds: LatestStreetMarkdown[]
): Promise<SchoolNameIssues[]> => {
  const result: SchoolNameIssues[] = [];
  for (const type of [SchoolType.Kindergarten, SchoolType.Elementary]) {
    const ofType = smds.filter((s) => s.schoolType === type);
    const candidates = await getSchoolCandidatesByCity(
      [...new Set(ofType.map((s) => s.cityCode))],
      type
    );
    for (const smd of ofType) {
      const issues = findSchoolNameIssues(
        smd.sourceText.split("\n"),
        candidates.get(smd.cityCode) ?? []
      );
      if (issues.length > 0) result.push({ smd, issues });
    }
  }
  return result;
};

/** Replace one line of a street markdown (1-based), keeping its indentation. */
export interface StreetMarkdownLineEdit {
  lineNumber: number;
  from: string;
  to: string;
}

/**
 * Save `edits` to a founder's current street markdown as a new version (same
 * author and state as the version it replaces, `comment` saying why), then
 * drop the cached map data of that ordinance so the map is rebuilt. A line no
 * longer reading `from` is left alone (the text changed since) and returned.
 */
export const saveStreetMarkdownEdits = async (
  smd: LatestStreetMarkdown,
  edits: StreetMarkdownLineEdit[],
  comment: string
): Promise<StreetMarkdownLineEdit[]> => {
  const lines = smd.sourceText.split("\n");
  const skipped: StreetMarkdownLineEdit[] = [];
  let changed = false;
  for (const edit of edits) {
    const current = lines[edit.lineNumber - 1];
    // `from` may be the line as the parser reads it (en dashes as hyphens)
    if (
      current === undefined ||
      (current.trim() !== edit.from && cleanLine(current) !== edit.from)
    ) {
      skipped.push(edit);
      continue;
    }
    lines[edit.lineNumber - 1] = current.replace(current.trim(), edit.to);
    changed = true;
  }
  if (!changed) return skipped;

  const knex = getKnexDb();
  await knex("street_markdown").insert({
    user_id: smd.userId,
    ordinance_id: smd.ordinanceId,
    founder_id: smd.founderId,
    state: smd.state,
    // UTC wall-clock, as the app saves it: a Date would be written in this
    // process's local time and, ahead of UTC, outrank the editor's later saves
    created_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    comment,
    source_text: lines.join("\n"),
  });
  await deleteMapData({ ordinanceId: smd.ordinanceId });
  return skipped;
};

/**
 * Drop cached map data so the app rebuilds it on the next view: of one
 * ordinance, or every map listing a school (its name is cached there).
 */
export const deleteMapData = async (
  where: { ordinanceId: number } | { schoolIzo: string }
): Promise<number> => {
  const query = getKnexDb()("map_data");
  return "ordinanceId" in where
    ? query.where("ordinance_id", where.ordinanceId).delete()
    : query
        .whereRaw("json_data LIKE ?", [`%"izo":"${where.schoolIzo}"%`])
        .delete();
};
