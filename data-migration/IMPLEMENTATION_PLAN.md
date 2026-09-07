# CR0025 ŠO → ISÚI export — implementation plan

Ordered, checkable task list for the školské-obvody migration export. This is the
**execution tracker**: what to build, in what order, and what's already done. The
*rationale* for every decision lives in `SKO_MIGRATION_PLAN.md` — this file only tracks
state. Keep the two in sync (see `CLAUDE.md`).

All export code lives in **`packages/text-to-map`** (it owns the open-data DB, the
street-markdown parser, boundaries, and the geometry pipeline). The catchment-areas app
only supplies the active street-markdown + founder/type and triggers the run.

Legend: `[x]` done & committed · `[~]` partially done · `[ ]` not started.
Commit hashes are on branch `cuzk-export` (not yet pushed — batch push per instruction).

---

## Phase 0 — Setup & design (done)

- [x] Monorepo: `text-to-map` as `packages/text-to-map`, consumed locally — `225cf4b`, `2b21090`
- [x] `ARCHITECTURE.md` overview — `8a41659`
- [x] `SKO_MIGRATION_PLAN.md` — all ČÚZK questions resolved, OPEN-1/2/3 closed — `8a41659`, `a738363`

## Phase 1 — Geometry pipeline (Part C core · `street-markdown/polygons.ts`)

Dependency chain: C-1 → C-2 → C-3 → {C-4, C-5} → C-6 → C-7 → C-8.

- [x] **C-1** Expose labeled Voronoi cell layer (`buildLabeledCells`); renderer byte-identical — `9c2e1d0`
- [x] **C-2** Dissolve cells by `areaIndexes` set → connected okrsek components — `5289b6a`
- [x] **C-3** Empty-fragment merge into neighbour by longest shared boundary (OPEN-1) — `2f14b53`
- [x] **C-4** Interior seams via segment-level dedup → `MIG_HRAN_KO` — `e0ef8b8`
- [x] **C-5** Interior def-point per okrsek → `MIG_DEF_BOD_KO` — `83e203a`
- [x] **C-6** Deterministic okrsek numbering (`CISLO`) — `24c458f`
- [x] **C-7** GeoPackage writer over `better-sqlite3`: `MIG_DEF_BOD_KO` (points) + `MIG_HRAN_KO`
  (lines) as spatial layers, descriptive `MIG_*` as attribute tables, WGS-84; CSV mirror — `859d946`.
  *Validated structurally by re-opening with better-sqlite3 (GPKG spec tables + WKB round-trip);
  no `ogr2ogr` in this env, so the GDAL open-check is deferred to C-8.*
- [x] **C-8** Dry run on one real complex obec → self-check → GPKG — `c9e34df`.
  Ran end-to-end on **Česká Lípa** (8 schools → 17 okrsky, 17 def points, 32 seams) against
  the dev DB; produced a structurally-valid `.gpkg` (GPKG magic, v10300, correct
  contents/geometry-column registration, WGS-84, CL bboxes) + CSV mirror; structural
  self-check clean. MI10 whole-obec reassembly is ČÚZK-side — verified on their load, not here.

## Phase 2 — Per-obec assembly (Part A/B core)

- [x] `buildObecTables` — assembles `MIG_SKOLSKY_OBVOD` (B1), `MIG_SKOLA_SKO` w/ TRIDA∩band (B2),
  okrsky/`MIG_SKO_KO` (C2/C3), `MIG_HRAN_KO` (C4), `MIG_DEF_BOD_KO` (C5) per obec — `913507b`
- [x] Deterministic code-minting via injected allocators (B4, per-obec) — `913507b`
- [x] **B3** `MIG_VYMEZENI_ZBYLYCH_KO` — trivial obec (one area = whole obec) → one
  `{OBEC_KOD, SKO_KOD}` row, no geometry (`build-obec.ts`) — `751f204`.
- [x] **B5** Pre-export dedup so MI12 / MI14 can't fire — `migration/dedupe.ts` `dedupeExport`
  collapses duplicate `MIG_SKO_KO` / `MIG_SKOLA_SKO` / `MIG_VYMEZENI_ZBYLYCH_KO` rows in
  `buildMigrationExport` — `751f204`.

## Phase 3 — Parser hook for whole-obec inclusion (Part D2, §8)

- [x] `absorbedWholeObce?: number[]` on `Area` — `processWholeMunicipalityLine` (`smd.ts`)
  records **City-type** absorbed obce (separate villages) on the current area; `build-obec.ts`
  emits `MIG_VYMEZENI_ZBYLYCH_KO(village_obec, area's ŠO)` for each, in both the trivial and
  complex paths — `61b1d51`. District-type inclusions (Prague/Ostrava městské části) are
  **excluded** — they're within the single obec (Q3) and handled by geometry, not vymezeni
  (verified: Praha 23's 37 whole-muni lines are all district-type → 0 vymezeni rows).

## Phase 4 — Orchestration driver

Foundation exists: `migration/run.ts` `buildMigrationExport(municipalities, {typeCode, gradesByIzo})`
fetches boundaries (`getCityPolygons`/`getDistrictPolygons` via `getMunicipalityBoundary`), runs
`buildObecTables` with **shared global allocators**, concatenates + dedupes. Works for plain
single-boundary obce (C-8/Bechyně). A3 (trivial vs complex) is already handled by B3's
`areas.length === 1` short-circuit. Remaining work, in order:

- [x] **P4-1 · Grade CSV loader (A2).** `migration/grades.ts` `loadGradesByIzo(csvPath?)` →
  `gradesByIzo(izo): SchoolGrades | undefined`. Reads UTF-8, `;`-delimited (`csv-parse/sync`),
  maps `t1..t9` **`X` → true** / blank → false keyed on `SkolaIzo`; duplicate IZO rows union
  (never lose an `X`). Wired into `bin/export-obec.ts` (replaces the full-band default).
  Unit-tested; verified end-to-end on Česká Lípa — `bb05c14`. The CSV `data/skolsky_rejstrik.csv`
  is committed, converted to UTF-8/LF for normal tracking (ČÚZK source is Win-1250).

- [x] **P4-2 · Multi-founder / multi-type export entrypoint.** `migration/run.ts` refactored into
  a pure `assembleExport(groups, cityPolygons, districtPolygons, gradesByIzo?)` (shared allocators,
  unit-testable) + `buildMigrationExportForGroups` (boundary fetch) + `exportOrdinances(inputs,
  gradesByIzo?)`: per ordinance resolves founder context (`getNewMunicipalityByFounderId`), seeds
  `initialState.currentMunicipality`, parses the DB `source_text`, then assembles all under
  **run-wide allocators** and `checkIntegrity`; returns `{ data, skipped, integrityProblems }`.
  `buildMigrationExport` kept as a thin single-type wrapper — `f59d028`. Verified end-to-end:
  Bechyně + Česká Lípa in one call → 10 obvody, globally-unique KOD 10001–10010, 0 integrity
  problems, `skipped: []`.

- [x] **P4-3 · Big-city per-district pooling (A5).** `buildObecTables` refactored into a general
  `buildPooledObecTables(obecKod, typeCode, allAreas, districtInputs[], ctx)` — each district
  input is a Voronoi clipped to its boundary; okrsky are concatenated so seam/def/numbering derive
  district-line seams and one CISLO range for free. `build-big-city.ts` `buildBigCityTables`
  globalises area indexes, redistributes cross-district points via `getExtraAreas` (§8 D1; extra
  pieces keep their home index → one ŠO across districts), and pools all a city's MČ founders into
  one obec. `assembleExport` groups district-type municipalities by parent city
  (`getCityCodesByDistrictCodes`) and processes obce in a deterministic order — `5e1ccca`.
  **Verified end-to-end:** Ostrava (18 MČ → 1 obec 554821, 37 district-line seams) and Praha
  (52 MČ → 1 obec 554782, 123 seams), both globally-unique KODs, 0 integrity problems.

- [x] **P4-4 · Batch runner (CLI).** `bin/export-batch.ts` (`npm run -w text-to-map export-batch --
  <outDir> [--state active] [--limit N]`) enumerates the latest `street_markdown` per
  (founder, ordinance) in a lifecycle state (default `active`, stored JSON-quoted), joined to
  `ordinance.school_type`, feeds `exportOrdinances`, and writes the batch GPKG + CSV with a
  self-check — `a0687a9`. Both DB bins now load the repo-root `.env.local` by absolute path
  (so `npm run` works from any cwd). **Verified** on the dev DB (no Active rows there, so run
  against `--state auto-save`): 8 ordinances → 5 obce, valid `.gpkg` (all 7 MIG_* tables) +
  CSV, self-check OK. Two bugs it surfaced, now fixed: self-check CISLO is unique per
  **(obec, type)** not per obec; `writeGeoPackage` overwrites an existing file.

## Phase 5 — 2.stupeň (Part E)

- [x] **E1–E4** — `exportOrdinances` expands every zš ordinance into a type-`1` **and** a type-`2`
  group (same municipalities); `buildPooledObecTables` re-derives the identical okrsek partition
  for type `2` (deterministic, own KODs, `TYP_OBVODU_KOD='2'`) — `7ad5be1`.
  - **E1/E2:** okrsky are the full partition; a type-`2` ŠO is created only for areas with a
    school teaching 6–9 (`hasSecondStage` from the CSV band), `MIG_SKOLA_SKO` filled `TRIDA_6..9`.
  - **E3:** okrsky of schools without 6–9 stay **orphan** (no `MIG_SKO_KO` link) — MI02 allows it,
    whole-obec coverage still holds.
  - **E4:** trivial obec type-`2` → `MIG_VYMEZENI_ZBYLYCH_KO`; `SKO_KOD` = the type-`2` ŠO, or
    **null** (orphan whole-obec coverage) when the single school has no 2.stupeň.
  - Unit-tested (E2/E3/E4); verified end-to-end on Bechyně + Česká Lípa (obvody/okrsky mirrored
    across types, TRIDA_6..9 correct, 0 integrity problems).

## Phase 6 — Validation & delivery (Part F)

- [x] **F1** Self-check harness (`migration/self-check.ts` `checkIntegrity`) replicating the
  CR0025 checks **MI01–MI14** (`CR0025.md` §"Kontrola dat") against our output tables, run in
  `exportOrdinances` and surfaced by `export-batch` — `f77dd72`. Faithful mapping (re-derived
  from the CR text, superseding the first pass which mislabelled several):
  - **MI01** OBEC_KOD populated on okrsek/obvod/vymezeni; optional registry membership via
    `knownObecKods`. **MI02** a KO↔ŠO link, where present, is same-type. **MI03** SKO_KO.KO_KOD
    → okrsek. **MI04** every ŠO has ≥1 okrsek link *or* whole-obec vymezeni. **MI05** SKO_KO /
    vymezeni SKO_KOD → obvod. **MI06** every ŠO has ≥1 MIG_SKOLA_SKO. **MI07** SKOLA_IZO in
    registry — optional via `knownIzos` (else ČÚZK-side). **MI08** def-point / seam KO_KOD →
    okrsek. **MI09** every okrsek has ≥1 def point. **MI11** each (obec, type) covered by an
    okrsek of that type or a vymezeni row. **MI12** no two same-type ŠO with identical school
    set + grade ranges. **MI13** grade flags fit the ŠO type band. **MI14** no two same-type ŠO
    with an identical linked-okrsek set.
  - **MI02 divergence (recorded):** CR-literal MI02 also requires *every* okrsek to be linked;
    ČÚZK relaxed this (`SKO_MIGRATION_PLAN.md` §1 Q1) so Part-E 2.stupeň orphan okrsky are
    allowed. We check only the same-type half and never flag orphans; `countOrphanOkrsky`
    exposes the tally. **If ČÚZK runs the strict MI02, every type-2 orphan okrsek would fail —
    the whole 2.stupeň design leans on that relaxation.**
  - **MI10** (topological reassembly of each okrsek polygon from seams + def point + the obec's
    RÚIAN outer boundary) is inherently ČÚZK-side — needs the boundary we don't ship — so we
    assert only its combinatorial preconditions (MI03/MI08 refs, no self-seam, non-degenerate
    seam geometry). **F3** data-quality (non-finite def coords, degenerate seams) folded in;
    the all-null-coord area surfaces as an MI04 obvod-with-no-okrsek. 23 unit tests.
  - **Validated on the dev DB** (`export-batch --state auto-save`, 5 obce): self-check clean.
    The run surfaced — and this ticket fixed — two real bugs: (i) `MIG_VYMEZENI_ZBYLYCH_KO`
    used `OBEC_KOD` as PK but Part E needs one whole-obec row per type (`975c155`); (ii) the
    assembler minted one ŠO **per area**, so an obec with a single school split across several
    areas produced duplicate same-school ŠO — a genuine **MI12** hit on obec 541630 — now
    collapsed to one ŠO per (obec, type, school circle) (`a657748`).
- [ ] **F2** Delivery: single GeoPackage (all `MIG_*`), WGS-84, CSV mirror fallback.
  One-shot final handover ~start of 2027, then frozen.
- [x] **QA tool** `packages/text-to-map/demo/` — `npm run -w text-to-map demo` renders a
  standalone HTML map (catchments + generated seams + def points + schools) for eyeballing an
  export. Repo-only (not shipped in `dist`). See `demo/README.md`.

## Phase 6b — First ČÚZK round-trip (`data-migration/_kontroly_v1.docx`)

ČÚZK ran the first delivered export through their own checks (Jiří Jindřich,
2026-08-06–14) and sent back `kontroly_v1.docx` (17 numbered items covering every
`MIG_*` table + MI01–MI14 + three new checks). Fixed so far, each its own commit:

- [x] **CISLO uniqueness (item 4).** CR0025 requires okrsek `CISLO` unique **within an
  obec across all three types**, not per (obec, type). `assembleExport` now carries the
  next free `CISLO` forward between an obec's per-type calls (`ObecBuildContext.cisloStart`)
  — `2f577d7`.
- [x] **MI11 all-types coverage (item 11).** Every obec appearing in `MIG_SKOLSKY_OKRSEK`
  or `MIG_VYMEZENI_ZBYLYCH_KO` must be covered for M **and** 1 **and** 2, not just the
  types actually submitted. Self-check tightened; `fillObecCoverage` in `run.ts` now
  synthesizes one blanket `{OBEC_KOD, SKO_KOD: null}` row per obec for whichever types
  aren't otherwise covered (109 obce hit this in the delivered export) — `c079fc7`.
- [x] **MI13 both directions (item 13).** Added the missing "type 1/2 must have ≥1 grade
  flagged inside its band" check (we only checked "none outside"). Was the largest error
  class in the report (3267 rows) — mostly stale/blank registry data (item 1), expected to
  shrink once ČÚZK's registry refresh lands, but the check itself needed the direction
  regardless — `e9ab9dd`.
- [x] **MI14 narrowed + whole-obec no longer exempt (item 14).** ČÚZK narrowed MI14 to
  "same **editor** (obvod's own `OBEC_KOD`) + same type + same vymezení" (was flagging
  false positives across unrelated editors), and stopped exempting whole-obec ŠO — those
  are now compared by linked `OBEC_KOD` set instead of okrsek set — `75ae1d2`.
- [x] **MI07 cascade delete (item 2).** 21 `MIG_SKOLA_SKO` rows referenced a `SKOLA_IZO`
  not in the školský rejstřík. Added `pruneUnknownSchools`: drop the school row,
  cascade-delete the obvod (+ its `MIG_SKO_KO` links + any `MIG_VYMEZENI_ZBYLYCH_KO` row)
  if that leaves it with zero schools. Runs before the MI11 fill-in so a cascaded obvod's
  obec+type gets backfilled — `b7fe9e1`.
  - **`SKOLA_IZO=1` traced and resolved.** Two of the 21 rows had the literal IZO `1`.
    Confirmed it's upstream open-data feed garbage, not our parser: `open-data-sync/schools.ts`
    pulls `izo: school.izo` straight off the ČÚZK/MŠMT JSON-LD feed with no fallback, and a
    repo-wide grep found no code path that could construct `"1"` on our side. Located it in both
    delivered exports (`out/` and `out2/MIG_SKOLA_SKO.csv`, `SKO_KOD` 10763/10958, obec 554782 —
    Praha) — same coordinates for both (`14.489396, 50.073953`), confirming it's one physical
    school (its type-1 and type-2 obvody) with a garbage IZO in the feed. `"1"` isn't in
    `skolsky_rejstrik.csv` either, so `pruneUnknownSchools` above already drops it going forward
    — no separate fix needed.
- [x] **Leftover whole-city founder pooling (item 14, part of item 16).** Confirmed against the
  dev DB: Liberec (563889) has "Statutární město Liberec" (`city`-typed, a real ~15KB
  street-by-street ordinance) alongside the self-governing `district`-typed "Vratislavice nad
  Nisou" — same obec code, but only the district branch in `assembleExport` bucketed/pooled
  them. The city-typed founder built standalone via `buildObecTables`, so its own
  `mergeIdenticalTerritoryObvody` pass never saw Vratislavice's output and vice versa.
  `assembleExport` now pools a `city`-typed municipality into its district siblings' bucket
  whenever its own code is some other district's parent city (`citiesWithDistricts`, derived
  from `parentCityByDistrict`) — no new geometry work needed, since `getMunicipalityPolygons`
  (`street-markdown/polygons.ts`) already subtracts sibling district polygons from the city
  polygon for any non-Brno city. Brno is excluded from pooling to mirror that same existing
  guard — it has an analogous stray "Statutární město Brno" founder, but its content is
  currently empty/fully `!`-commented so it never reaches the build loop; not live today, but
  the same class of bug the moment someone edits that content back in — `206a7b6`. This fixed
  the specific `563889 M OBCE 11662,11663 2 563889 1` conflict in ČÚZK's Kontrola-14-souběh
  file (Liberec kindergarten), but *not* Liberec's elementary types — those needed the next fix.
- [x] **Self-referential "whole municipality" line (item 16, the actual majority cause).**
  `processWholeMunicipalityLine` (`street-markdown/smd.ts`) treated any City-type "území obce X"
  reference as a foreign absorbed village (§8 mechanism B) and emitted a
  `MIG_VYMEZENI_ZBYLYCH_KO` row for it — even when X is the school's *own* obec, declaring "this
  area covers the whole town" (e.g. several kindergartens jointly covering all of a town). That
  row then collides with the real okrsek geometry the same area produces once it's not going
  through the single-area trivial-obec shortcut. Scanned the delivered export (`out/`) for
  self-referential vymezeni rows (`OBEC_KOD` == the owning obec of their own `SKO_KOD`): 211
  total, of which exactly **60** also had real okrsek coverage for the same obec+type — an exact
  match to ČÚZK's reported count, and confirmed independent of the pooling fix above (Ostrava,
  already correctly pooled, was in that 60 too). Fix: only record the `absorbedWholeObce` entry
  when the referenced municipality's code differs from the current one. Validated against the
  live dev DB: re-ran `export-batch --city Liberec` and `--city Ostrava` — both now show **0**
  self-referential conflicts (Liberec: 4→3 vymezeni rows; Ostrava: 2→0 conflicts) — `c517151`.
- [x] **Kontrola 14 (souběh) self-check.** `self-check.ts` had no rule replicating ČÚZK's own
  "an obec+type can't have both explicit okrsky and a MIG_VYMEZENI_ZBYLYCH_KO row" check, even
  after both causes above were fixed — added as a standing regression guard against a third,
  not-yet-seen cause. Naturally covers the absorbed-foreign-village case too (an absorbed
  village owns no okrsky of its own, so it never matches) — `30087b9`.
- [x] **Def-point topology (item 17, new "Kontrola 15") — the §8 absorption boundary.** Checked
  the live dev DB for the D3 street-level-cross-obec mechanism (`smd.ts`'s "navíc ulice obce X"):
  essentially unused in production (1 case in the whole operative set — Cheb/Odrava), so it isn't
  the cause. The real mechanism is §8 whole-village absorption (the *foreign*-obec case — the
  self-reference case was fix #7 above): `processWholeMunicipalityLine` folds an absorbed
  village's real addresses into the current area so they still pull the Voronoi lines the way
  they always have, and `getMunicipalityBoundary` unions every absorbed village's polygon into
  the *clip boundary* used to shape that same tessellation. The resulting okrsek polygon (and any
  def point picked from its generators) can legitimately end up inside the absorbed village
  rather than the owning obec. Confirmed against the dev DB: Benešov (529303) absorbs 10
  neighbouring villages (Kozmice, Petroupim, Mrač, …) — exactly the villages ČÚZK's file names as
  mismatch targets for this obec. Fix (per the user's suggested shape — keep the existing wide
  tessellation untouched so internal boundaries between an obec's own schools don't shift, then
  re-clip *after*): `dissolveAreaSetComponents` gets an optional `trueBoundary` param applied via
  a second `intersect` after the existing one; a fragment that disappears or loses all its
  generators there is handled by the exact same null-check and `mergeEmptyFragments` paths
  already used for the first clip. `getMunicipalityOwnBoundary` computes the narrow boundary by
  reusing `getMunicipalityBoundary` with `cityCodes` restricted to the municipality's own code
  (`districtCodes` — always same-obec sibling městské části, never a foreign absorption — is left
  untouched). Threaded through `build-obec.ts`, `build-big-city.ts`, and `run.ts`'s standalone
  obec path. Validated against real data: ran `export-batch --city Benešov` against the live dev
  DB and checked all 30 resulting def points against Benešov's actual RÚIAN polygon
  (`city.polygon_geojson`) — 30/30 now fall inside, self-check clean — `fc93fd3`.

**Still open from this report:**
- **Item 1** — waiting on ČÚZK's refreshed `skolsky_rejstrik.csv`; re-run self-check once
  it lands, expect most MI07/MI13 noise to clear.
- **Item 12 (MI12, 377 duplicate groups / 754 ŠO)** — ČÚZK's own text says this is *their*
  problem ("tohle je úkol pro mě... čísla SKO generuji automaticky"): duplicates arise in
  their cross-supplier national merge (SKO_KOD ranges in the report straddle 10000s *and*
  50000s — different suppliers), not in our single export. No code action; ČÚZK resolves
  manually (2nd round or hand-edit in ISÚI).
- **Item 15** — ČÚZK's own "Kontrola 13" (DB-table-level checks) is still "v přípravě" on
  their side; nothing to do yet.
- **Missing hrany (part of item 17)** — the screenshots also showed some dangling/incomplete
  seam edges; the def-point fix above should shrink this (a seam that used to run through
  absorbed-village territory now gets cropped away with the rest of that geometry), but it
  hasn't been separately re-verified against the specific "missing hrany" screenshots ČÚZK sent.
  Worth another look once ČÚZK re-runs their checks on a fresh export.

## Phase 7 — App trigger (catchment-areas)

- [ ] Thin trigger in the app: resolve the `Active` StreetMarkdown per founder/ordinance/type,
  supply SMD text + founder/type to text-to-map, kick off the export.

---

## Not exercised (confirmed unused — no work)

- D3 street-level cross-obec, part-level cross-boundary — our data never does this.
- OPEN-3 unmapped-point coverage gaps — Voronoi built only from `area.addresses`; non-issue.
