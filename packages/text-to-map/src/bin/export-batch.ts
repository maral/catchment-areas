import { configDotenv } from "dotenv";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Load the repo-root DB config before anything reads it (works from any cwd,
// e.g. `npm run` sets cwd to the package dir). `override: true` makes .env.local
// authoritative over any stale TEXTTOMAP_* vars already exported in the shell.
configDotenv({
  path: join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", ".env.local"),
  override: true,
});

import { disconnectKnex, getKnexDb } from "../db/db";
import { SchoolType } from "../db/types";
import { writeCsvMirror, writeGeoPackage } from "../migration/geopackage";
import { loadGradesByIzo } from "../migration/grades";
import { exportOrdinances, OrdinanceInput } from "../migration/run";

/**
 * P4-4 — batch runner. Enumerates the ordinances to export from the app DB (the
 * latest `street_markdown` per founder + ordinance in a given lifecycle state,
 * `active` for a real handover), runs the whole export, and writes the batch
 * GeoPackage + CSV mirror. CLI counterpart of the Phase 7 app trigger.
 *
 *   npm run -w text-to-map export-batch -- <outDir> [--state active] [--limit N]
 *                                                   [--founder <id>] [--city <name>]
 *
 * Run from the repo root so `.env.local` (the DB config) resolves. `--state`
 * accepts the raw lifecycle value (active / draft / auto-save …); `--limit`
 * caps the number of ordinances (for a quick dry run on non-active data).
 * To export a single city, pass `--founder <founder_id>` or `--city <name>`
 * (matches the founder name, case-insensitively; a big city's districts all
 * pool into its one obec automatically).
 */
async function main() {
  const args = process.argv.slice(2);
  const outDir = args.find((a) => !a.startsWith("--"));
  const state = argValue(args, "--state") ?? "active";
  const limit = Number(argValue(args, "--limit") ?? "0");
  const founderId = Number(argValue(args, "--founder") ?? "0");
  const city = argValue(args, "--city");
  if (!outDir) {
    console.error(
      "Usage: export-batch <outDir> [--state active] [--limit N] [--founder <id>] [--city <name>]"
    );
    process.exit(1);
  }

  const db = getKnexDb();
  // `state` is stored JSON-quoted (e.g. "active"); pick the latest markdown per
  // (founder, ordinance) in that state, joined to its ordinance for the type.
  const latest = db("street_markdown")
    .select("founder_id", "ordinance_id")
    .max("id as max_id")
    .where("state", JSON.stringify(state))
    .groupBy("founder_id", "ordinance_id");

  let query = db("street_markdown as s")
    .join("ordinance as o", "s.ordinance_id", "o.id")
    .join(latest.as("l"), "s.id", "l.max_id")
    .select(
      "s.founder_id as founderId",
      "o.school_type as schoolType",
      "s.source_text as sourceText"
    )
    .orderBy("s.founder_id");
  if (founderId > 0) query = query.where("s.founder_id", founderId);
  if (city) {
    query = query
      .join("founder as f", "s.founder_id", "f.id")
      .whereRaw("LOWER(f.name) LIKE ?", [`%${city.toLowerCase()}%`]);
  }
  if (limit > 0) query = query.limit(limit);

  const rows = await query;
  const filterNote =
    founderId > 0 ? ` (founder ${founderId})` : city ? ` (city ~ "${city}")` : "";
  console.log(`Found ${rows.length} '${state}' ordinance(s) to export${filterNote}.`);
  if (rows.length === 0) {
    await disconnectKnex();
    process.exit(0);
  }

  const inputs: OrdinanceInput[] = rows.map((r) => ({
    founderId: r.founderId,
    sourceText: r.sourceText,
    schoolType: r.schoolType as SchoolType,
  }));

  const grades = loadGradesByIzo();
  console.time("export");
  const { data, skipped, integrityProblems } = await exportOrdinances(
    inputs,
    grades
  );
  console.timeEnd("export");

  const obce = new Set(data.obvody.map((o) => o.OBEC_KOD)).size;
  console.log(
    `Exported ${obce} obce: ${data.obvody.length} obvody, ${data.okrsky.length} okrsky, ` +
      `${data.skoKo.length} sko-ko, ${data.defBody.length} def points, ` +
      `${data.hrany.length} seams, ${data.skolaSko.length} skola-sko, ` +
      `${data.vymezeni.length} whole-obec.`
  );
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} ordinance(s) (founder unresolved):`);
    for (const s of skipped.slice(0, 20)) {
      console.log(`  - founder ${s.founderId}: ${s.reason}`);
    }
  }

  mkdirSync(outDir, { recursive: true });
  const gpkgPath = join(outDir, "sko_export.gpkg");
  writeGeoPackage(data, gpkgPath);
  writeCsvMirror(data, outDir);
  console.log(`Wrote GeoPackage -> ${gpkgPath} (+ CSV mirror in ${outDir}).`);

  if (integrityProblems.length === 0) {
    console.log("Self-check: OK (all structural invariants hold).");
  } else {
    console.log(`Self-check: ${integrityProblems.length} problem(s):`);
    for (const p of integrityProblems.slice(0, 30)) console.log(`  - ${p}`);
  }

  await disconnectKnex();
  process.exit(integrityProblems.length === 0 ? 0 : 2);
}

const argValue = (args: string[], flag: string): string | undefined => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
