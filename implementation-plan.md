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

- [ ] **P4-4 · Batch runner (CLI).** A bin that enumerates the ordinances to export — **Active**
  `street_markdown` per founder + type from the app DB (state stored JSON-quoted, e.g.
  `"active"`) — feeds P4-2, and writes the batch GPKG + CSV. This is the CLI counterpart of the
  Phase 7 app trigger. **Done when:** one command produces the full-batch GeoPackage from the DB.

## Phase 5 — 2.stupeň (Part E)

- [ ] **E1** Copy 1.st okrsek partition as type-`2` okrsky (same geometry, own `KOD`)
- [ ] **E2** Per 1.st school with grades 6–9: type-`2` ŠO, link okrsek, fill `TRIDA_6..9`
- [ ] **E3** Schools without grades 6–9 → okrsky left **orphan** (no type-`2` ŠO)
- [ ] **E4** Single-full-school obce: whole-obec type-`2` via `MIG_VYMEZENI_ZBYLYCH_KO`

## Phase 6 — Validation & delivery (Part F)

- [~] **F1** Self-check harness replicating MI01–MI14 against generated tables before handover
  (fold in the F3 data-quality check: drop/flag an area whose addresses are all null-coord).
  *Seeded:* `migration/self-check.ts` `checkIntegrity` covers the structural invariants
  (one def point/okrsek, unique CISLO, MI02 type match, MI04 coverage, seam/ref integrity).
  *Still to do:* the geometry checks and full MI01–MI14 coverage.
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
