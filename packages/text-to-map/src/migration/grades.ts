import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import iconv from "iconv-lite";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { SchoolGrades } from "./types";

/**
 * A2 — load the ČÚZK školský-rejstřík grade table into a `gradesByIzo` lookup
 * for the export (`ObecBuildContext.gradesByIzo`).
 *
 * The file (`data/skolsky_rejstrik.csv`) is **Windows-1250**, `;`-delimited, and
 * its grade columns `t1..t9` hold **`X`** (grade taught) / blank — *not* the
 * `A`/`N` we emit. Keyed on `SkolaIzo` (the school IZO catchment areas use).
 */
const GRADE_KEYS = [
  "t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9",
] as const;

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CSV_PATH = join(
  __dirname,
  "..",
  "..",
  "data",
  "skolsky_rejstrik.csv"
);

interface RejstrikRow {
  SkolaIzo?: string;
  t1?: string; t2?: string; t3?: string; t4?: string; t5?: string;
  t6?: string; t7?: string; t8?: string; t9?: string;
}

export type GradesByIzo = (izo: string) => SchoolGrades | undefined;

export const loadGradesByIzo = (
  csvPath: string = DEFAULT_CSV_PATH
): GradesByIzo => {
  const text = iconv.decode(readFileSync(csvPath), "win1250");
  const rows = parse(text, {
    delimiter: ";",
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as RejstrikRow[];

  const byIzo = new Map<string, SchoolGrades>();
  for (const row of rows) {
    const izo = String(row.SkolaIzo ?? "").trim();
    if (!izo) continue;
    const existing = byIzo.get(izo);
    // A school IZO should carry one grade profile; if it appears twice, take
    // the union (any row that marks a grade taught wins) — never lose an "X".
    const grades = {} as SchoolGrades;
    for (const key of GRADE_KEYS) {
      grades[key] = row[key] === "X" || (existing?.[key] ?? false);
    }
    byIzo.set(izo, grades);
  }

  return (izo: string) => byIzo.get(String(izo).trim());
};
