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

## Phase 7 — App trigger (catchment-areas)

- [ ] Thin trigger in the app: resolve the `Active` StreetMarkdown per founder/ordinance/type,
  supply SMD text + founder/type to text-to-map, kick off the export.

---

## Not exercised (confirmed unused — no work)

- D3 street-level cross-obec, part-level cross-boundary — our data never does this.
- OPEN-3 unmapped-point coverage gaps — Voronoi built only from `area.addresses`; non-issue.
