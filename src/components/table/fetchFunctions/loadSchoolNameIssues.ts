import { SchoolType } from "@/types/basicTypes";
import { findActiveSchoolNameIssues } from "text-to-map";

/**
 * Cities whose active ordinance has a street-markdown line that isn't a
 * school's exact registry name — the parser silently resolves it to the
 * closest name, which after a rename is often another school. A failed check
 * mustn't take the overview down, so it then reports none.
 */
export async function loadSchoolNameIssueCityCodes(
  schoolType: SchoolType
): Promise<number[]> {
  try {
    const issues = await findActiveSchoolNameIssues(schoolType);
    return Array.from(new Set(issues.map((i) => i.smd.cityCode)));
  } catch (error) {
    console.error("School-name check failed:", error);
    return [];
  }
}
