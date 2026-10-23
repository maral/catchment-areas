/**
 * Demo / debugging tool for the ŠO → ISÚI migration geometry.
 *
 * Parses an ordinance, runs the migration export, and produces a standalone,
 * self-contained HTML map (no server, no external assets) overlaying the
 * generated seams + definition points on the rendered catchment areas, plus the
 * schools. Open the emitted file directly in a browser.
 *
 *   npm run -w text-to-map demo                            # Česká Lípa, elementary
 *   npm run -w text-to-map demo -- ms                      # kindergarten
 *   npm run -w text-to-map demo -- zs path/to/vyhlaska.txt # any ordinance
 *
 * Reads the DB config from the repo-root `.env.local`, so it runs against
 * whatever DB you have configured there (the dev server by default).
 */
import { configDotenv } from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { basename, dirname, join } from "path";
import { fileURLToPath } from "url";
import { disconnectKnex } from "../src/db/db";
import { SchoolType } from "../src/db/types";
import { buildMigrationExport } from "../src/migration/run";
import { municipalitiesToPolygons } from "../src/street-markdown/polygons";
import { parseOrdinanceToAddressPoints } from "../src/street-markdown/smd";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");
// Make the repo-root DB config available (getKnexDb reads env lazily).
configDotenv({ path: join(repoRoot, ".env.local") });

const DEFAULT_ORDINANCE = join(
  __dirname,
  "..",
  "examples",
  "vyhlaska_ceska_lipa.txt"
);

async function main() {
  const args = process.argv.slice(2);
  const typeArg = args.find((a) => a === "zs" || a === "ms") ?? "zs";
  const filePath = args.find((a) => a.endsWith(".txt")) ?? DEFAULT_ORDINANCE;

  const schoolType =
    typeArg === "zs" ? SchoolType.Elementary : SchoolType.Kindergarten;
  const typeCode = typeArg === "zs" ? "1" : "M";

  console.log(`Parsing ${filePath} (${typeArg})...`);
  const lines = readFileSync(filePath).toString().split("\n");
  const municipalities = await parseOrdinanceToAddressPoints({
    lines,
    schoolType,
    initialState: {},
    onError: () => {},
    onWarning: () => {},
    includeUnmappedAddressPoints: false,
  });

  const polygonsByCode = await municipalitiesToPolygons(municipalities);
  const areaFeatures = Object.values(polygonsByCode).flatMap(
    (fc: any) => fc.features
  );

  const data = await buildMigrationExport(municipalities, { typeCode });

  const schools = municipalities.flatMap((m) =>
    m.areas.flatMap((a) =>
      a.schools
        .filter((s) => s.position?.lng && s.position?.lat)
        .map((s) => ({
          izo: s.izo,
          name: s.name,
          lng: s.position!.lng,
          lat: s.position!.lat,
          address: s.position!.address,
        }))
    )
  );

  const payload = {
    name: municipalities[0]?.municipalityName ?? basename(filePath),
    areas: { type: "FeatureCollection", features: areaFeatures },
    seams: data.hrany.map((h) => ({
      id: h.ID,
      ko1: h.KO_KOD1,
      ko2: h.KO_KOD2,
      coordinates: h.geometry.coordinates,
    })),
    defPoints: data.defBody.map((d) => ({
      ko: d.KO_KOD,
      lng: d.geometry.coordinates[0],
      lat: d.geometry.coordinates[1],
    })),
    schools,
    counts: {
      areas: areaFeatures.length,
      okrsky: data.okrsky.length,
      seams: data.hrany.length,
      defPoints: data.defBody.length,
      schools: schools.length,
    },
  };

  const outDir = join(__dirname, "out");
  mkdirSync(outDir, { recursive: true });
  const slug = basename(filePath, ".txt").replace(/[^a-z0-9]+/gi, "_");

  const template = readFileSync(join(__dirname, "template.html"), "utf8");
  const html = template.replace("/*__DATA__*/ {}", JSON.stringify(payload));
  const htmlPath = join(outDir, `${slug}.html`);
  writeFileSync(htmlPath, html);
  writeFileSync(join(outDir, `${slug}-data.json`), JSON.stringify(payload));

  console.log("counts:", JSON.stringify(payload.counts));
  console.log(`\nOpen the map:\n  file://${htmlPath}`);
  await disconnectKnex();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
