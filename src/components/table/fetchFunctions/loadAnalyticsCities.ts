import { AnalyticsDataType, SchoolType } from "@/types/basicTypes";
import { AnalyticsCityData, AnalyticsCityRow } from "@/types/analyticsTypes";
import { KnexDataProvider } from "remult/remult-knex";

const DIACRITICS_MAP: { [key: string]: string[] } = {
  A: ["A", "Á"],
  C: ["C", "Č"],
  D: ["D", "Ď"],
  E: ["E", "É", "Ě"],
  I: ["I", "Í"],
  N: ["N", "Ň"],
  O: ["O", "Ó"],
  R: ["R", "Ř"],
  S: ["S", "Š"],
  T: ["T", "Ť"],
  U: ["U", "Ú", "Ů"],
  Y: ["Y", "Ý"],
  Z: ["Z", "Ž"],
};

export async function loadAnalyticsCities(
  schoolType?: SchoolType,
  dataType?: AnalyticsDataType,
  letter?: string,
  hideEmpty?: boolean,
): Promise<AnalyticsCityData[]> {
  const knex = KnexDataProvider.getDb();

  let schoolCountConditions = "ad.school_izo IS NOT NULL";
  const schoolCountParams: number[] = [];

  if (schoolType !== undefined) {
    schoolCountConditions += " AND ad.school_type = ?";
    schoolCountParams.push(schoolType);
  }
  if (dataType !== undefined) {
    schoolCountConditions += " AND ad.type = ?";
    schoolCountParams.push(dataType);
  }

  const schoolCountExpr = `COUNT(DISTINCT CASE WHEN ${schoolCountConditions} THEN CONCAT(ad.school_izo, ':', ad.school_type) END)`;

  let query = knex("city as c")
    .join("analytics_data as ad", "c.code", "ad.city_code")
    .select(
      "c.code as city_code",
      "c.name as city_name",
      knex.raw(
        "MAX(CASE WHEN ad.type = ? THEN ad.count END) as social_exclusion_index",
        [AnalyticsDataType.SocialExclusionIndex],
      ),
      knex.raw(
        "MAX(CASE WHEN ad.type = ? THEN ad.count END) as population_density",
        [AnalyticsDataType.PopulationDensity],
      ),
      knex.raw(
        "MAX(CASE WHEN ad.type = ? THEN ad.count END) as early_school_leavers",
        [AnalyticsDataType.EarlySchoolLeavers],
      ),
      knex.raw(`${schoolCountExpr} as school_count`, schoolCountParams),
    )
    .groupBy("c.code", "c.name")
    .orderBy("c.name");

  if (letter) {
    const upperLetter = letter.toUpperCase();
    const allowedChars = DIACRITICS_MAP[upperLetter] || [upperLetter];
    query = query.whereRaw(
      `UPPER(SUBSTRING(c.name, 1, 1)) IN (${allowedChars.map(() => "?").join(", ")})`,
      allowedChars,
    );
  }
  if (hideEmpty) {
    query = query.havingRaw(`${schoolCountExpr} > 0`, schoolCountParams);
  } else {
    query = query.havingRaw(
      `${schoolCountExpr} > 0
       OR MAX(CASE WHEN ad.type = ? THEN ad.count END) IS NOT NULL
       OR MAX(CASE WHEN ad.type = ? THEN ad.count END) IS NOT NULL`,
      [
        ...schoolCountParams,
        AnalyticsDataType.SocialExclusionIndex,
        AnalyticsDataType.EarlySchoolLeavers,
      ],
    );
  }

  const rows = (await query) as AnalyticsCityRow[];

  return rows.map(
    (row: AnalyticsCityRow): AnalyticsCityData => ({
      city: {
        code: row.city_code,
        name: row.city_name,
      },
      socialExclusionIndex: row.social_exclusion_index
        ? { count: row.social_exclusion_index }
        : null,
      populationDensity: row.population_density
        ? { count: row.population_density }
        : null,
      earlySchoolLeavers: row.early_school_leavers
        ? { count: row.early_school_leavers }
        : null,
      schoolCount: Number(row.school_count) || 0,
    }),
  );
}
