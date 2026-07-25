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
- [ ] **C-8** Dry run on one real complex obec → F1 self-check → hand GPKG to ČÚZK.
  **Done when:** MI10 reassembly passes without manual fixes. *(needs synced DB)*

## Phase 2 — Per-obec assembly (Part A/B core)

- [x] `buildObecTables` — assembles `MIG_SKOLSKY_OBVOD` (B1), `MIG_SKOLA_SKO` w/ TRIDA∩band (B2),
  okrsky/`MIG_SKO_KO` (C2/C3), `MIG_HRAN_KO` (C4), `MIG_DEF_BOD_KO` (C5) per obec — `913507b`
- [x] Deterministic code-minting via injected allocators (B4, per-obec) — `913507b`
- [ ] **B3** `MIG_VYMEZENI_ZBYLYCH_KO` — trivial (whole-obec) obce: one row, filled `SKO_KOD`
- [ ] **B5** Pre-export dedup so MI12 / MI14 can't fire

## Phase 3 — Parser hook for whole-obec inclusion (Part D2, §8)

- [ ] Add `absorbedWholeObce` to `Area` — capture village→school pairing **at parse time**,
  emit `MIG_VYMEZENI_ZBYLYCH_KO(village_obec, absorbing ŠO)`. Cross-obec = whole-obec only.

## Phase 4 — Orchestration driver

- [ ] Global driver: iterate (obec, type ∈ {M, 1.st}); `parseOrdinanceToAddressPoints`;
  load ČÚZK grade CSV (A2); classify trivial vs complex (A3); fetch boundaries
  (`getCityPolygons` / `getDistrictPolygons`); run `buildObecTables` with **shared global
  allocators**; **Prague/big-city pooling (A5):** per-district clip → empty-merge → combine
  into one obec partition before seam/def derivation. Never call `addExtraPolygons` (D1).

## Phase 5 — 2.stupeň (Part E)

- [ ] **E1** Copy 1.st okrsek partition as type-`2` okrsky (same geometry, own `KOD`)
- [ ] **E2** Per 1.st school with grades 6–9: type-`2` ŠO, link okrsek, fill `TRIDA_6..9`
- [ ] **E3** Schools without grades 6–9 → okrsky left **orphan** (no type-`2` ŠO)
- [ ] **E4** Single-full-school obce: whole-obec type-`2` via `MIG_VYMEZENI_ZBYLYCH_KO`

## Phase 6 — Validation & delivery (Part F)

- [ ] **F1** Self-check harness replicating MI01–MI14 against generated tables before handover
  (fold in the F3 data-quality check: drop/flag an area whose addresses are all null-coord)
- [ ] **F2** Delivery: single GeoPackage (all `MIG_*`), WGS-84, CSV mirror fallback.
  One-shot final handover ~start of 2027, then frozen.

## Phase 7 — App trigger (catchment-areas)

- [ ] Thin trigger in the app: resolve the `Active` StreetMarkdown per founder/ordinance/type,
  supply SMD text + founder/type to text-to-map, kick off the export.

---

## Not exercised (confirmed unused — no work)

- D3 street-level cross-obec, part-level cross-boundary — our data never does this.
- OPEN-3 unmapped-point coverage gaps — Voronoi built only from `area.addresses`; non-issue.
