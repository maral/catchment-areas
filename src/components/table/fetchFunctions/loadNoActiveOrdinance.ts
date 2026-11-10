import { SchoolType } from "@/types/basicTypes";
import { KnexDataProvider } from "remult/remult-knex";

/**
 * Cities that have ordinances of the type but none marked active — the map
 * then has nothing to show, and the ČÚZK export (which takes the active
 * ordinance) reports the city instead of exporting it.
 */
export async function loadNoActiveOrdinanceCityCodes(
  schoolType: SchoolType
): Promise<number[]> {
  const rows: { city_code: number }[] = await KnexDataProvider.getDb()(
    "ordinance"
  )
    .where("school_type", schoolType)
    .groupBy("city_code")
    .havingRaw("MAX(is_active) = 0")
    .select("city_code");
  return rows.map((row) => Number(row.city_code));
}
