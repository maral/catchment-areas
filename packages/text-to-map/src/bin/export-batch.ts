import { configDotenv } from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Load the repo-root DB config before anything reads it (works from any cwd,
// e.g. `npm run` sets cwd to the package dir). `override: true` makes .env.local
// authoritative over any stale TEXTTOMAP_* vars already exported in the shell.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
configDotenv({
  path: join(repoRoot, ".env.local"),
  override: true,
});

import { disconnectKnex, getKnexDb } from "../db/db";
import { SchoolType } from "../db/types";
import { writeCsvMirror, writeGeoPackage } from "../migration/geopackage";
import { loadGradesByIzo } from "../migration/grades";
import {
  ExternalMapData,
  exportOrdinances,
  OrdinanceInput,
} from "../migration/run";

/**
 * P4-4 — batch runner. Enumerates the ordinances to export from the app DB and
 * runs the whole export, writing the batch GeoPackage + CSV mirror. CLI
 * counterpart of the Phase 7 app trigger.
 *
 *   npm run -w text-to-map export-batch -- <outDir> [--as-of YYYY-MM-DD] [--state <lifecycle>] [--limit N]
 *                                                   [--founder <id>] [--city <name>]
 *
 * Selection modes (mutually exclusive):
 *   - default / --published : the handover set. For every city marked Published
 *     for a school type (status_elementary / status_kindergarten = 3), export
 *     its *operative* ordinance — the one marked active in the app
 *     (`is_active`; the overview flags a city with none). With `--as-of
 *     YYYY-MM-DD` instead the newest one in force on that date: valid_from <=
 *     as-of AND (valid_to is null OR valid_to >= as-of). A Published city+type
 *     with ordinances but none picked, or several picked, is reported in the
 *     self-check. Then take the current `street_markdown` per (founder,
 *     ordinance) for that ordinance (newest created_at, as the editor shows
 *     it), skipping an empty one — content lives in `auto-save`, never
 *     `active`, so the finalized set is defined by the *city* status + the
 *     ordinance, not the markdown lifecycle state.
 *   - --state <lifecycle> : legacy/dry-run mode — pick the latest markdown per
 *     (founder, ordinance) whose markdown is in that raw lifecycle state
 *     (auto-save / draft / initial …). Useful to smoke a specific state.
 *
 * Run from the repo root so `.env.local` (the DB config) resolves. `--limit`
 * caps the number of ordinances. To export a single city, pass
 * `--founder <founder_id>` or `--city <name>` (matches the founder name,
 * case-insensitively; a big city's districts all pool into its one obec).
 *
 * An operative ordinance with `external_data` set comes from the city's own
 * geodata (the app's `external-data/<key>/map-data-<type>.json`): it's exported
 * from that map data as is, with no street markdown. `--city` matches its city
 * name, `--founder` and `--state` leave it out.
 */
const PUBLISHED = 3; // City.CityStatus.Published

async function main() {
  const args = process.argv.slice(2);
  const outDir = args.find((a) => !a.startsWith("--"));
  const state = argValue(args, "--state"); // explicit → legacy state mode
  const publishedMode = state === undefined; // default is the Published handover set
  const limit = Number(argValue(args, "--limit") ?? "0");
  const founderId = Number(argValue(args, "--founder") ?? "0");
  const city = argValue(args, "--city");
  // by default the ordinance marked active in the app; `--as-of` instead takes
  // the newest one in force on that date
  const asOf = argValue(args, "--as-of");
  if (!outDir || (asOf !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(asOf))) {
    console.error(
      "Usage: export-batch <outDir> [--as-of YYYY-MM-DD] [--state <lifecycle>] [--limit N] [--founder <id>] [--city <name>]"
    );
    process.exit(1);
  }

  const db = getKnexDb();
  const hasExternalData = await db.schema.hasColumn("ordinance", "external_data");
  let externalInputs: OrdinanceInput[] = [];
  let query;
  const selectionProblems: string[] = [];
  if (publishedMode) {
    // Step 1: the operative ordinance per (city, type) of each Published
    // city+type — the active one, or with `--as-of` the newest valid on that
    // date. One row per candidate; we pick the first per (city, type) in JS
    // (ordered newest valid_from first).
    const publishedOrdinances = () =>
      db("ordinance as o")
        .join("city as c", "o.city_code", "c.code")
        .where((b) =>
          b
            .where((e) =>
              e
                .where("o.school_type", SchoolType.Elementary)
                .andWhere("c.status_elementary", PUBLISHED)
            )
            .orWhere((k) =>
              k
                .where("o.school_type", SchoolType.Kindergarten)
                .andWhere("c.status_kindergarten", PUBLISHED)
            )
        );
    const candidates = await publishedOrdinances()
      .modify((q) => {
        if (asOf === undefined) q.where("o.is_active", true);
        else
          q.where("o.valid_from", "<=", asOf).where((v) =>
            v.whereNull("o.valid_to").orWhere("o.valid_to", ">=", asOf)
          );
      })
      .orderBy([
        { column: "o.city_code" },
        { column: "o.school_type" },
        { column: "o.valid_from", order: "desc" },
        { column: "o.id", order: "desc" },
      ])
      .select(
        "o.id",
        "o.number",
        "o.city_code as cityCode",
        "c.name as cityName",
        "o.school_type as schoolType"
      );

    const operativeIds: number[] = [];
    const picked = new Map<string, (typeof candidates)[number]>();
    const typeName = (type: number) =>
      type === SchoolType.Kindergarten ? "MŠ" : "ZŠ";
    for (const c of candidates) {
      const key = `${c.cityCode}-${c.schoolType}`;
      const first = picked.get(key);
      if (first) {
        selectionProblems.push(
          `data: ${c.cityName} ${typeName(c.schoolType)}: several ${
            asOf === undefined ? "active" : "equally new"
          } ordinances — exported ${first.number} (${first.id}), not ${c.number} (${c.id})`
        );
        continue;
      }
      picked.set(key, c);
      operativeIds.push(c.id);
    }
    // a Published city+type with ordinances but none picked drops out of the
    // export entirely — report it rather than lose it silently
    const withOrdinances = await publishedOrdinances()
      .distinct("o.city_code as cityCode", "c.name as cityName", "o.school_type as schoolType");
    for (const c of withOrdinances) {
      if (!picked.has(`${c.cityCode}-${c.schoolType}`)) {
        selectionProblems.push(
          `data: ${c.cityName} ${typeName(c.schoolType)}: no ${
            asOf === undefined ? "active ordinance" : `ordinance in force on ${asOf}`
          } — not exported`
        );
      }
    }

    // an ordinance from the city's own geodata has its map data, no markdown
    const external = hasExternalData
      ? await db("ordinance as o")
          .join("city as c", "o.city_code", "c.code")
          .whereIn("o.id", operativeIds)
          .whereNotNull("o.external_data")
          .modify((q) => {
            if (city) q.whereRaw("LOWER(c.name) LIKE ?", [`%${city.toLowerCase()}%`]);
            if (founderId > 0) q.whereRaw("1 = 0");
          })
          .select("o.id", "o.school_type as schoolType", "o.external_data as externalData")
      : [];
    externalInputs = external.map((o) => ({
      founderId: 0,
      sourceText: "",
      schoolType: o.schoolType as SchoolType,
      externalMapData: loadExternalMapData(o.externalData, o.schoolType),
    }));
    const externalIds = new Set(external.map((o) => o.id));
    const markdownIds = operativeIds.filter((id) => !externalIds.has(id));

    // Step 2: the current markdown per (founder, ordinance) for those
    // operative ordinances — the one the editor and the map use: newest
    // `created_at`, `id` breaking ties. (The highest id isn't always it: the
    // ordinance's raw extracted text can be saved after the editor's first
    // backup, Uherský Brod ZŠ.) An empty current one is skipped below.
    const latest = db
      .from(
        db("street_markdown")
          .select(
            "id",
            db.raw(
              "ROW_NUMBER() OVER (PARTITION BY founder_id, ordinance_id ORDER BY created_at DESC, id DESC) AS rn"
            )
          )
          .whereIn("ordinance_id", markdownIds)
          .as("ranked")
      )
      .where("rn", 1)
      .select("id as max_id");

    query = db("street_markdown as s")
      .join("ordinance as o", "s.ordinance_id", "o.id")
      .join(latest.as("l"), "s.id", "l.max_id")
      .whereRaw("LENGTH(s.source_text) > 0")
      .select(
        "s.founder_id as founderId",
        "s.ordinance_id as ordinanceId",
        "o.school_type as schoolType",
        "s.source_text as sourceText"
      )
      .orderBy("s.founder_id");
  } else {
    // Legacy state mode: `state` is stored JSON-quoted (e.g. "auto-save").
    const latest = db("street_markdown")
      .select("founder_id", "ordinance_id")
      .max("id as max_id")
      .where("state", JSON.stringify(state))
      .groupBy("founder_id", "ordinance_id");

    query = db("street_markdown as s")
      .join("ordinance as o", "s.ordinance_id", "o.id")
      .join(latest.as("l"), "s.id", "l.max_id")
      .select(
        "s.founder_id as founderId",
        "s.ordinance_id as ordinanceId",
        "o.school_type as schoolType",
        "s.source_text as sourceText"
      )
      .orderBy("s.founder_id");
  }
  if (founderId > 0) query = query.where("s.founder_id", founderId);
  if (city) {
    query = query
      .join("founder as f", "s.founder_id", "f.id")
      .whereRaw("LOWER(f.name) LIKE ?", [`%${city.toLowerCase()}%`]);
  }
  if (limit > 0) query = query.limit(limit);

  const rows = await query;
  // One ordinance is the source document even for a broken-down city (its
  // districts each contribute a street-markdown row that pools into one obec),
  // so the ordinance count is the meaningful "how many documents" number; the
  // row count is the founder-level breakdown.
  const ordinanceCount =
    new Set(rows.map((r) => r.ordinanceId)).size + externalInputs.length;
  const selectorNote = publishedMode
    ? `published (${asOf === undefined ? "active" : `in force on ${asOf}`})`
    : `'${state}'`;
  const filterNote =
    founderId > 0 ? ` (founder ${founderId})` : city ? ` (city ~ "${city}")` : "";
  console.log(
    `Found ${ordinanceCount} ${selectorNote} ordinance(s) to export${filterNote}` +
      ` (${rows.length} street-markdown row(s) across founders` +
      (externalInputs.length > 0
        ? `, ${externalInputs.length} from the city's own geodata`
        : "") +
      ").",
  );
  if (rows.length + externalInputs.length === 0) {
    await disconnectKnex();
    process.exit(0);
  }

  const inputs: OrdinanceInput[] = [
    ...rows.map((r) => ({
      founderId: r.founderId,
      sourceText: r.sourceText,
      schoolType: r.schoolType as SchoolType,
    })),
    ...externalInputs,
  ];

  const grades = loadGradesByIzo();
  console.time("export");
  const isTty = process.stdout.isTTY;
  const startedAt = Date.now();
  const { data, skipped, droppedEmptyObvody, integrityProblems: checkProblems } =
    await exportOrdinances(inputs, grades, (p) => {
      const secs = Math.round((Date.now() - startedAt) / 1000);
      if (p.phase === "retry") {
        process.stdout.write(
          `${isTty ? "\n" : ""}  ↻ DB hiccup — retry ${p.attempt} ` +
            `(founder ${p.founderId}, ${secs}s)…\n`
        );
        return;
      }
      if (p.phase === "assemble") {
        process.stdout.write(
          `${isTty ? "\n" : ""}Parsed ${p.total}/${p.total} (${secs}s). ` +
            `Assembling geometry + self-check…\n`
        );
        return;
      }
      const pct = Math.round((p.done / p.total) * 100);
      const line =
        p.phase === "geometry"
          ? `  geometry ${p.done}/${p.total} obce (${pct}%, obec ${p.obecKod}, ${secs}s)`
          : `  parsing ${p.done}/${p.total} (${pct}%, founder ${p.founderId}, ${secs}s)`;
      // In a terminal, keep it on one self-updating line; when piped/redirected,
      // emit a line periodically so a log still shows progress (and where a
      // timeout hit) without hundreds of lines of noise.
      if (isTty) process.stdout.write(`\r${line}\x1b[K`);
      else if (p.done % 25 === 0 || p.done === p.total) console.log(line);
    });
  const integrityProblems = [...selectionProblems, ...checkProblems];
  // the last geometry tick left the cursor mid-line (no trailing \n, same as
  // the parse phase's ticks do before the "assemble" transition message)
  if (isTty) process.stdout.write("\n");
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
  if (droppedEmptyObvody.length > 0) {
    console.log(
      `Dropped ${droppedEmptyObvody.length} empty-territory ŠO ` +
        `(school listed with no addresses — unmigratable, CR0025 MI04):`
    );
    for (const d of droppedEmptyObvody) {
      console.log(
        `  - obec ${d.OBEC_KOD} type ${d.TYP_OBVODU_KOD}, school IZO ${d.izos.join(", ") || "—"}`
      );
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
    const reportPath = join(outDir, "self-check.txt");
    writeFileSync(reportPath, integrityProblems.join("\n") + "\n", "utf8");
    console.log(
      `Self-check: ${integrityProblems.length} problem(s) (full list -> ${reportPath}):`
    );
    for (const p of integrityProblems.slice(0, 30)) console.log(`  - ${p}`);
  }

  await disconnectKnex();
  process.exit(integrityProblems.length === 0 ? 0 : 2);
}

/** The app's map data converted from a city's geodata (`convert-external-data`). */
const loadExternalMapData = (
  externalData: string,
  schoolType: SchoolType
): ExternalMapData => {
  if (!/^[a-z0-9-]+$/.test(externalData)) {
    throw new Error(`Invalid external data key '${externalData}'.`);
  }
  const type = schoolType === SchoolType.Elementary ? "elementary" : "kindergarten";
  return JSON.parse(
    readFileSync(
      join(repoRoot, "external-data", externalData, `map-data-${type}.json`),
      "utf8"
    )
  );
};

const argValue = (args: string[], flag: string): string | undefined => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
