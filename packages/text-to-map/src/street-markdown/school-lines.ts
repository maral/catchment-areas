import { findClosestString } from "../utils/helpers";
import { cleanLine } from "./smd";

/** A school the parser can resolve a street-markdown line to. */
export interface SchoolNameCandidate {
  izo: string;
  name: string;
}

/** A street-markdown line the parser reads as a school. */
export interface SchoolLine {
  /** 1-based, as in the editor */
  lineNumber: number;
  /** the line as the parser matches it */
  line: string;
  /** an area's first school line — always taken as a school, however far off */
  first: boolean;
  /** the school the parser resolves it to (null: the founder has no schools) */
  school: SchoolNameCandidate | null;
  /** the line is the school's current name exactly */
  exact: boolean;
}

/** Edit distance up to which a further line of an area is still a school. */
const NEXT_SCHOOL_MAX_DISTANCE = 4;

/**
 * Every line of one founder's street markdown that the parser reads as a
 * school, with the school it resolves to — the same rules as
 * `parseOrdinanceToAddressPoints`, without touching the DB. An area's first
 * line is always a school: a name that isn't exact silently resolves to the
 * closest one, which is a *different* school once a school has been renamed.
 * Further lines are schools only within a small edit distance.
 *
 * `schools` are the founder's candidates (its city's schools of the
 * ordinance's type). A `#` line switches to another founder whose schools we
 * don't have, so the scan stops there.
 */
export const findSchoolLines = (
  lines: string[],
  schools: SchoolNameCandidate[]
): SchoolLine[] => {
  const names = schools.map((s) => s.name);
  const byName = (name: string) => schools.find((s) => s.name === name) ?? null;
  const found: SchoolLine[] = [];
  let inArea = false;
  let schoolsCompleted = false;

  for (const [i, rawLine] of lines.entries()) {
    const line = cleanLine(rawLine);
    if (line[0] === "#") break;
    if (line === "") {
      inArea = false;
      continue;
    }
    if (line[0] === "!") continue;

    if (!inArea) {
      const raw = rawLine.trim();
      const exact = byName(raw);
      const school =
        exact ?? (names.length > 0 ? byName(findClosestString(raw, names)!) : null);
      found.push({ lineNumber: i + 1, line: raw, first: true, school, exact: exact !== null });
      inArea = true;
      schoolsCompleted = false;
      continue;
    }

    if (!schoolsCompleted) {
      const exact = byName(line);
      const school =
        exact ?? byName(findClosestString(line, names, NEXT_SCHOOL_MAX_DISTANCE) ?? "");
      if (school) {
        found.push({ lineNumber: i + 1, line, first: false, school, exact: exact !== null });
      } else {
        schoolsCompleted = true;
      }
    }
  }
  return found;
};

/** The school lines that aren't a school's current name exactly. */
export const findSchoolNameIssues = (
  lines: string[],
  schools: SchoolNameCandidate[]
): SchoolLine[] => findSchoolLines(lines, schools).filter((l) => !l.exact);
