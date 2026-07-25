import { mkdirSync } from "fs";
import { join } from "path";
import { disconnectKnex } from "../db/db";
import { SchoolType } from "../db/types";
import {
  writeCsvMirror,
  writeGeoPackage,
} from "../migration/geopackage";
import { buildMigrationExport } from "../migration/run";
import { checkIntegrity } from "../migration/self-check";
import { SchoolTypeCode } from "../migration/types";
import { parseOrdinanceToAddressPoints } from "../street-markdown/smd";
import { readFileSync } from "fs";

/**
 * C-8 dry run — parse one ordinance, assemble the MIG_* tables against the
 * open-data DB, write the GeoPackage + CSV mirror, and run the structural
 * self-check.
 *
 *   npm run -w text-to-map export-obec -- <zs|ms> <ordinance.txt> <outDir>
 *
 * Run from the repo root so `.env.local` (the DB config) resolves.
 */
async function main() {
  const [, , typeArg, fileName, outDir] = process.argv;
  if (!typeArg || !fileName || !outDir) {
    console.error(
      "Usage: export-obec <zs|ms> <ordinance.txt> <outDir>"
    );
    process.exit(1);
  }
  if (typeArg !== "zs" && typeArg !== "ms") {
    console.error("School type must be 'zs' or 'ms'");
    process.exit(1);
  }
  const schoolType =
    typeArg === "zs" ? SchoolType.Elementary : SchoolType.Kindergarten;
  // zs = 1. stupeň for the migration model; ms = mateřská.
  const typeCode: SchoolTypeCode = typeArg === "zs" ? "1" : "M";

  const lines = readFileSync(fileName).toString().split("\n");

  let errorCount = 0;
  const municipalities = await parseOrdinanceToAddressPoints({
    lines,
    schoolType,
    initialState: {},
    onError: ({ lineNumber, line }) => {
      errorCount++;
      console.error(`  parse error, line ${lineNumber}: ${line}`);
    },
    onWarning: () => {},
    includeUnmappedAddressPoints: false,
  });

  console.log(
    `Parsed ${municipalities.length} municipalit(ies), ${errorCount} parse error(s).`
  );

  const data = await buildMigrationExport(municipalities, { typeCode });

  console.log(
    `Assembled: ${data.obvody.length} obvody, ${data.okrsky.length} okrsky, ` +
      `${data.skoKo.length} sko-ko links, ${data.defBody.length} def points, ` +
      `${data.hrany.length} seams, ${data.skolaSko.length} skola-sko, ` +
      `${data.vymezeni.length} whole-obec.`
  );

  mkdirSync(outDir, { recursive: true });
  const gpkgPath = join(outDir, "sko_export.gpkg");
  writeGeoPackage(data, gpkgPath);
  writeCsvMirror(data, outDir);
  console.log(`Wrote GeoPackage -> ${gpkgPath} (+ CSV mirror in ${outDir}).`);

  const problems = checkIntegrity(data);
  if (problems.length === 0) {
    console.log("Self-check: OK (all structural invariants hold).");
  } else {
    console.log(`Self-check: ${problems.length} problem(s):`);
    for (const p of problems) console.log(`  - ${p}`);
  }

  await disconnectKnex();
  process.exit(problems.length === 0 ? 0 : 2);
}

main();
