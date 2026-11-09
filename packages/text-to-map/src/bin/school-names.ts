import { configDotenv } from "dotenv";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Load the repo-root DB config before anything reads it (works from any cwd).
// `override: true` makes .env.local authoritative over any stale TEXTTOMAP_*
// vars already exported in the shell.
configDotenv({
  path: join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..", ".env.local"),
  override: true,
});

import { disconnectKnex, getKnexDb } from "../db/db";
import {
  findActiveSchoolNameIssues,
  getSchoolCandidatesByCity,
  LatestStreetMarkdown,
  saveStreetMarkdownEdits,
  StreetMarkdownLineEdit,
} from "../db/street-markdowns";
import { SchoolType } from "../db/types";
import { SchoolLine } from "../street-markdown/school-lines";

/**
 * School lines in the active ordinances' street markdowns that aren't a
 * school's exact name. The parser resolves such a line to the closest name —
 * after a rename usually another school. Writes a Markdown report:
 *
 * - **renamed** — the line is a name our cached map data once resolved to a
 *   school that's still there; the fix is that school's current name;
 * - **spelling** — the line differs from the school it resolves to only in
 *   whitespace, punctuation or case; the fix is that school's exact name;
 * - **by hand** — everything else (typos, schools of another founder, stray
 *   lines), with the school the line resolves to today.
 *
 * A fix is suggested only when its name is unique in the city, so it resolves
 * to exactly that school.
 *
 *   npm run -w text-to-map school-names -- <report.md> [--apply] [--base-url URL]
 *
 * `--apply` saves the suggested fixes as new street-markdown versions and drops
 * every cached map showing an outdated school name (the app rebuilds it).
 */
const args = process.argv.slice(2);
const reportPath = args.find((a) => !a.startsWith("--"));
const apply = args.includes("--apply");
const baseUrlIndex = args.indexOf("--base-url");
const baseUrl = (
  baseUrlIndex >= 0 ? args[baseUrlIndex + 1] : "https://mapaspadovosti.softresource.cz"
).replace(/\/$/, "");

interface Finding {
  smd: LatestStreetMarkdown;
  cityName: string;
  issue: SchoolLine;
  /** the school the line meant, when we can tell */
  meant?: { izo: string; name: string };
  /** how we can tell: a renamed school (cached map data) or the same name spelt differently */
  why?: "renamed" | "spelling";
}

/** A name with case, whitespace and punctuation ignored. */
const loose = (name: string): string =>
  name.toLocaleLowerCase("cs").replace(/[\s.,;:\-–"„“”'()]/g, "");

const main = async () => {
  if (!reportPath) {
    console.error("Usage: school-names <report.md> [--apply] [--base-url URL]");
    process.exit(1);
  }
  const knex = getKnexDb();
  const issues = await findActiveSchoolNameIssues();

  const cityCodes = [...new Set(issues.map((i) => i.smd.cityCode))];
  const cityNames = new Map(
    (await knex("city").whereIn("code", cityCodes).select("code", "name")).map(
      (r: any) => [Number(r.code), String(r.name)]
    )
  );
  const candidates = new Map<SchoolType, Map<number, { izo: string; name: string }[]>>();
  for (const type of [SchoolType.Kindergarten, SchoolType.Elementary]) {
    candidates.set(type, await getSchoolCandidatesByCity(cityCodes, type));
  }

  // name -> IZOs as our cached maps of these cities once resolved them
  const cachedIzos = new Map<string, Set<string>>();
  const mapIds = (
    await knex("map_data").whereIn("city_code", cityCodes).select("id")
  ).map((r: any) => r.id);
  for (const id of mapIds) {
    const row = await knex("map_data").where({ id }).first("json_data");
    if (!row?.json_data) continue;
    const data = typeof row.json_data === "string" ? JSON.parse(row.json_data) : row.json_data;
    for (const m of data ?? []) {
      for (const a of m.areas ?? []) {
        for (const s of a.schools ?? []) {
          if (!s.izo || !s.name) continue;
          const set = cachedIzos.get(s.name.trim()) ?? new Set<string>();
          set.add(String(s.izo));
          cachedIzos.set(s.name.trim(), set);
        }
      }
    }
  }

  const findings: Finding[] = [];
  for (const { smd, issues: lines } of issues) {
    const inCity = candidates.get(smd.schoolType)?.get(smd.cityCode) ?? [];
    // a fix must resolve to exactly that school: its name unique in the city
    const unique = <T extends { name: string }>(school?: T | null): T | undefined =>
      school && inCity.filter((s) => s.name === school.name).length === 1
        ? school
        : undefined;
    for (const issue of lines) {
      const izos = cachedIzos.get(issue.line);
      const renamed = unique(
        izos?.size === 1 ? inCity.find((s) => izos.has(s.izo)) : undefined
      );
      const respelt =
        issue.school && loose(issue.school.name) === loose(issue.line)
          ? unique(issue.school)
          : undefined;
      findings.push({
        smd,
        cityName: cityNames.get(smd.cityCode) ?? "?",
        issue,
        meant: renamed ?? respelt,
        why: renamed ? "renamed" : respelt ? "spelling" : undefined,
      });
    }
  }
  const byCity = (a: Finding, b: Finding) =>
    a.cityName.localeCompare(b.cityName, "cs") ||
    a.smd.founderName.localeCompare(b.smd.founderName, "cs") ||
    a.issue.lineNumber - b.issue.lineNumber;
  const renamed = findings.filter((f) => f.why === "renamed").sort(byCity);
  const respelt = findings.filter((f) => f.why === "spelling").sort(byCity);
  const suggested = [...renamed, ...respelt];
  const manual = findings.filter((f) => !f.meant).sort(byCity);

  const link = (f: Finding) =>
    `${baseUrl}/admin/${
      f.smd.schoolType === SchoolType.Kindergarten ? "kindergarten" : "elementary"
    }/${f.smd.cityCode}/edit-ordinance/${f.smd.founderId}/${f.smd.ordinanceId}`;
  const type = (f: Finding) => (f.smd.schoolType === SchoolType.Kindergarten ? "MŠ" : "ZŠ");
  const cell = (s: string) => s.replace(/\|/g, "\\|");
  const where = (f: Finding) =>
    `[${cell(f.cityName)} ${type(f)}${
      f.smd.founderName !== f.cityName ? ` – ${cell(f.smd.founderName)}` : ""
    }, ř. ${f.issue.lineNumber}](${link(f)})`;

  const out: string[] = [
    "# Názvy škol v uličních seznamech",
    "",
    `Aktivní vyhlášky, ${new Date().toLocaleDateString("cs")}. Řádek, který není přesným názvem školy, ` +
      "se dnes přiřadí k nejpodobnějšímu názvu — po přejmenování často k jiné škole.",
    "",
    `## Přejmenované školy (${renamed.length})`,
    "",
    "Podle uložené mapy řádek dříve odpovídal škole, která je stále v obci — oprava je její současný název. " +
      "**Tučně** = dnes se řádek přiřadí k jiné škole.",
    "",
    "| Kde | Řádek | Opravit na | Dnes se přiřadí k |",
    "|---|---|---|---|",
    ...renamed.map(
      (f) =>
        `| ${where(f)} | ${cell(f.issue.line)} | ${cell(f.meant!.name)} | ${
          f.issue.school?.izo === f.meant!.izo
            ? "téže škole"
            : `**${cell(f.issue.school?.name ?? "—")}**`
        } |`
    ),
    "",
    `## Jiný zápis téhož názvu (${respelt.length})`,
    "",
    "Řádek se od názvu v rejstříku liší jen mezerami, interpunkcí nebo velikostí písmen; přiřazuje se už teď ke správné škole.",
    "",
    "| Kde | Řádek | Opravit na |",
    "|---|---|---|",
    ...respelt.map((f) => `| ${where(f)} | ${cell(f.issue.line)} | ${cell(f.meant!.name)} |`),
    "",
    `## K ruční opravě (${manual.length})`,
    "",
    "| Kde | Řádek | Dnes se přiřadí k |",
    "|---|---|---|",
    ...manual.map(
      (f) =>
        `| ${where(f)} | ${cell(f.issue.line)} | ${cell(f.issue.school?.name ?? "— (není škola)")} |`
    ),
    "",
  ];
  writeFileSync(reportPath, out.join("\n"), "utf8");
  console.log(
    `${findings.length} school line(s) not exact: ${renamed.length} renamed, ${respelt.length} spelling, ${manual.length} by hand -> ${reportPath}`
  );

  if (apply) {
    const bySmd = new Map<number, Finding[]>();
    for (const f of suggested) bySmd.set(f.smd.id, [...(bySmd.get(f.smd.id) ?? []), f]);
    let saved = 0;
    for (const group of bySmd.values()) {
      const edits: StreetMarkdownLineEdit[] = group.map((f) => ({
        lineNumber: f.issue.lineNumber,
        from: f.issue.line,
        to: f.meant!.name,
      }));
      const skipped = await saveStreetMarkdownEdits(
        group[0].smd,
        edits,
        `Automatická úprava: oprava ${edits.length === 1 ? "názvu školy" : "názvů škol"} podle rejstříku (${edits
          .map((e) => `„${e.from}“ → „${e.to}“`)
          .join(", ")})`
      );
      saved += edits.length - skipped.length;
      for (const s of skipped) {
        console.log(`  skipped (text changed): founder ${group[0].smd.founderId} line ${s.lineNumber}`);
      }
    }
    console.log(`Applied ${saved} fix(es) in ${bySmd.size} street markdown(s).`);
  }

  // cached maps showing a name the school no longer has (rebuilt on next view)
  const currentName = new Map(
    (await knex("school").select("izo", "name")).map((r: any) => [String(r.izo), String(r.name)])
  );
  const stale: number[] = [];
  for (const { id } of await knex("map_data").select("id")) {
    const row = await knex("map_data").where({ id }).first("json_data");
    if (!row?.json_data) continue;
    const data = typeof row.json_data === "string" ? JSON.parse(row.json_data) : row.json_data;
    const outdated = (data ?? []).some((m: any) =>
      (m.areas ?? []).some((a: any) =>
        (a.schools ?? []).some(
          (s: any) => currentName.has(s.izo) && currentName.get(s.izo) !== s.name
        )
      )
    );
    if (outdated) stale.push(id);
  }
  if (apply && stale.length > 0) {
    await knex("map_data").whereIn("id", stale).delete();
  }
  console.log(
    `${stale.length} cached map(s) with outdated school names${apply ? " dropped" : ""}.`
  );
};

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectKnex());
