# Školské obvody → ISÚI Migration — Work Plan (CR0025)

**Goal:** deterministically transform our catchment-area data (parsed street-markdown →
`Municipality[]` → areas → address points + Voronoi geometry) into the ČÚZK migration
interface tables (`MIG_*`) defined in CR0025, for **MŠ** and **1.stupeň ZŠ**.

**Status:** living document. Last updated 2026-06-25. **All five ČÚZK questions answered —
the build is essentially unblocked.**

> Related: [ARCHITECTURE.md](./ARCHITECTURE.md), [UBIQUITOUS_LANGUAGE.md](./UBIQUITOUS_LANGUAGE.md).
> Geometry code lives in `text-to-map/src/street-markdown/polygons.ts`.

## Legend

- ✅ **READY** — design settled, can be implemented now.
- 🚧 **PARTIAL** — most of it is ready; a minor residual remains (noted inline).
- 📋 **DECIDED** — a design decision we've made and recorded.
- ❓ **PARKED** — our own open question, not ČÚZK's (revisit later).
- ✉️ **CLARIFY** — small follow-up to send ČÚZK, not blocking.

---

## 1. ČÚZK answers (all resolved) — authoritative record

Answered by **Jiří Jindřich (JJ)** and **Petr Souček (PSO)**.

- **Q1 — orphan okrsky / type independence (MI02).** Types (1, 2, MŠ) are treated **entirely
  separately; no cross-type checks.** **MI02 only checks that a KO↔ŠO link, *if present*, is
  the same type — it does NOT force every okrsek to have a ŠO.** Orphan okrsky are fine. The
  only hard rule is: **the whole obec must be covered by okrsky of that type.** → No "MI11
  relaxation" needed; we simply omit deferred 2.st obce from the type-2 run.
- **Q2 — multipolygon vs. multiple okrsky.** Both JJ and PSO prefer **separate okrsky, one
  simple polygon each, joined only at the ŠO level.** → **No multipolygon okrsky.**
- **Q3 — Prague / big cities.** Treat **Praha (and Ostrava, Plzeň, Liberec) as a single
  obec**; ignore městské části entirely.
- **Q4 — geometry format & CRS.** Deliver as **GeoPackage (GPKG)**; ČÚZK loads to DB
  themselves via GDAL. CRS: **S-JTSK / EPSG:5514 preferred** (their default, cm rounding);
  **WGS-84 is acceptable** (GDAL reprojects on ingest).
- **Q-delivery — handover format & timeline** (JJ, later thread). **CSV is enough, but JJ's
  mental model is "everything in one GeoPackage."** No API / no online delivery. Timeline:
  ČÚZK will **request the final handover at the start of 2027**, run a last test on the test
  environment, then **freeze** — no further minor changes folded in, even though migration
  itself happens ~April 2027. → **Decision:** primary deliverable is **one GeoPackage
  containing all `MIG_*`** (spatial layers + non-spatial attribute tables); CSV mirror as a
  convenience/fallback. See §2 + C-7 for the writer/CRS decision.

### Residual follow-ups — all resolved (our calls, no email needed)

- **2.stupeň:** reuse the **1.stupeň okrsek partition** for type `2` (same geometry, copied
  as type-`2` okrsky). Assign each type-`2` okrsek to a type-`2` ŠO **iff its school has
  grades 6–9** (per the CSV); otherwise leave the okrsek **orphan** (allowed by Q1). In scope
  now — no deferral. Caveat below.
- **Seam-endpoint tolerance:** cm snapping to the RÚIAN obec boundary is sufficient (per Q4).
- **Descriptive tables:** go into the **single GeoPackage as non-spatial attribute tables**
  (JJ's "all in one geopackage"), with a **CSV mirror** as fallback ("CSV nám stačí"). ČÚZK
  loads the file; we get **no DB access**.
- **`SKOLA_IZO`:** converted to number on our side; no leading-zero collisions. Fine.

> **Caveat on reused 2.stupeň geometry:** correct for single-full-school obce and for
> málotřídka territory (left orphan). In obce with **≥2 full (1–9) schools** whose ordinance
> draws a *different* internal boundary for 2.st than for 1.st, reusing the 1.st boundary can
> misassign addresses near that boundary. Accepted as an approximation; municipalities
> correct exceptions after migration.

---

## 2. Decisions 📋

- **okrsek = overlay atom:** dissolve labeled Voronoi cells by their `areaIndexes` *set*; a
  set shared by two schools → one shared okrsek linked to both obvody via `MIG_SKO_KO`.
- **One okrsek per connected component** (per Q2) — every okrsek is a **single polygon**; a
  spatially split area-set becomes several okrsky, joined at the ŠO. *(Supersedes the earlier
  "one multipolygon okrsek" idea.)*
- **Orphan okrsky allowed; types fully independent** (per Q1). Used directly for 2.st:
  okrsky of 1st-only schools stay orphan in the type-`2` run; no rule relaxation needed.
- **Overlaps only from intentional dual-assignment** of an address — proven from the
  cell-labeling in `polygons.ts`; no other overlaps possible.
- **Export from the labeled-cell layer** (`d3DelaunayVoronoi` output), not the merged
  per-area polygons (lossy, sliver-prone).
- **Interior seams only** in `MIG_HRAN_KO`; obec-boundary edges generated internally by
  ČÚZK. City boundaries used to **terminate** seam endpoints (line∩boundary), not to clip
  polygons.
- **Deliverable:** **one GeoPackage with all `MIG_*`** — spatial layers (`MIG_DEF_BOD_KO`
  points, `MIG_HRAN_KO` lines) + non-spatial attribute tables for the rest; CSV mirror as
  fallback. **CRS: ship WGS-84 (EPSG:4326); ČÚZK reprojects to S-JTSK/5514 via GDAL on
  ingest** (their offer, and their transform is authoritative — avoids a proj4 dep and any
  Křovák datum-shift error on our side; the existing `jtsk2wgs84.ts` only goes JTSK→WGS-84,
  not the inverse we'd need). **Writer: hand-rolled via `better-sqlite3`** (already a dep;
  GeoPackage *is* SQLite) — no new native/binary dependency, so the export stays fully
  self-contained and re-runnable on demand. Validate the `.gpkg` with GDAL in C-8.
- **Prague et al. → single obec** (per Q3); pool all district-level catchments under the
  one `OBEC_KOD`.
- **Grade flags** `TRIDA_1..9` = (school's real grades from ČÚZK CSV) ∩ (type band); type
  `1` → grades 1–5. Satisfies MI13.
- **Deterministic codes:** mint `KOD`/`CISLO` from stable inputs (obec_kod + type + area
  index), not autoincrement. ~300 obce → comfortably within NUMBER widths.
- **`NAZEV` left empty** (names generated by ČÚZK per CR0023).
- **IZO normalization:** cast to number on every join side.
- **2.stupeň reuses the 1.stupeň partition** (copied as type-`2` okrsky); okrsky of schools
  without grades 6–9 are left orphan (Q1). In scope, not deferred.

---

## 3. Work breakdown — almost all READY

### Part A — Source extraction & obec classification ✅ READY

- A1. Per obec & type (M, 1.st): active street-markdown → `Municipality[]` → areas.
- A2. Load ČÚZK school-grade CSV (`red_izo, izo, ruian_kod, zuj, okres, t1..t9`).
- A3. Classify each (obec, type): **trivial** (one area = whole obec) vs **complex**.
- A4. Map area → school(s) → IZO (normalized).
- A5. **Prague/big-city pooling:** merge district-level catchments into one obec partition
  (districts are geographically disjoint → clean pooling, no spurious overlaps).

### Part B — Relational / attribute export (non-geometry) ✅ READY

- B1. `MIG_SKOLSKY_OBVOD` — one row per area (ŠO): `KOD`, `OBEC_KOD`, `TYP_OBVODU_KOD`,
  `NAZEV`/`POZNAMKA` empty.
- B2. `MIG_SKOLA_SKO` — per (ŠO, school): `SKO_KOD`, `SKOLA_IZO`, `TRIDA_1..9` from CSV ∩
  type band.
- B3. `MIG_VYMEZENI_ZBYLYCH_KO` — trivial obce: one row, filled `SKO_KOD`.
- B4. Deterministic code-minting module (shared with Part C).
- B5. Pre-export dedup so MI12 / MI14 can't fire.

### Part C — Geometry export (complex obce) ✅ READY

- C1. **Refactor** `polygons.ts` to expose the labeled Voronoi cell collection as a reusable
  intermediate (renderer keeps unioning; exporter dissolves).
- C2. Dissolve cells by `areaIndexes` set, **split into connected components** → one okrsek
  (one polygon) per component; `MIG_SKOLSKY_OKRSEK` rows (`KOD`, `OBEC_KOD`,
  `TYP_OBVODU_KOD`, `CISLO` unique within obec).
- C3. `MIG_SKO_KO` — link each okrsek to every obvod in its set.
- C4. `MIG_DEF_BOD_KO` — one interior address point per okrsek (single point, ≥1 guaranteed).
- C5. `MIG_HRAN_KO` — interior seams via segment-level dedup of okrsek boundaries (owned by 2
  okrsky = seam; by 1 = obec edge, skipped). Empty-fragment merge + per-district clipping +
  seam/def-point derivation are specified in **§7** (authoritative).
- C6. **Serialize to GPKG, reproject to EPSG:5514, round to cm.** *(was blocked; now resolved)*

### Part D — Cross-district & cross-obec ✅ READY (collapsed — see §8)

- D1. **`extraAreas` = cross-*district* only** (Prague/Ostrava/Plzeň/Liberec, always one
  batch), **never cross-obec**. Under Q3 (city = one obec) these pieces are all *within one
  obec* → just extra okrsky of a school's ŠO in another district, produced by §7's per-district
  processing and linked via `MIG_SKO_KO`. **Export divergence: never run `addExtraPolygons`**
  (renderer-only union). District-line seam emitted by §7 segment-dedup.
- D2. **Cross-obec = whole-obec village inclusion only** → emit
  `MIG_VYMEZENI_ZBYLYCH_KO(village_obec, absorbing ŠO)` (frequent, trivial, no geometry).
  Capture the village→school pairing **at parse time** (`absorbedWholeObce` on the `Area`),
  not via a post-hoc address lookup — see §8.
- D3. **Not exercised:** street-level cross-obec and part-level cross-boundary (confirmed
  unused). The CR's general cross-obec geometry/skip machinery doesn't apply to our data.

### Part E — 2.stupeň ✅ READY

- E1. Copy the 1.stupeň okrsek partition as type-`2` okrsky (same geometry,
  `TYP_OBVODU_KOD='2'`, own `KOD`).
- E2. For each 1.st school with grades 6–9 (per CSV): create a type-`2` ŠO, link its okrsek
  via `MIG_SKO_KO`, fill `MIG_SKOLA_SKO` with `TRIDA_6..9`.
- E3. Okrsky of schools **without** grades 6–9 → left **orphan** (no type-`2` ŠO). Whole-obec
  coverage still holds (same partition). See the caveat in §1.
- E4. Single-full-school obce: whole-obec type-`2` via `MIG_VYMEZENI_ZBYLYCH_KO` (trivial case).

### Part F — Validation & delivery ✅ READY (lighter than before)

- F1. Self-check harness replicating MI01–MI14 against generated tables before handover.
- F2. **Delivery (we produce one file; ČÚZK loads it — no DB access on our side):** a
  **single GeoPackage** holding *all* `MIG_*` — spatial layers (`MIG_DEF_BOD_KO`,
  `MIG_HRAN_KO`) + non-spatial attribute tables for the rest — in **WGS-84** (ČÚZK reprojects
  to 5514 via GDAL). **CSV mirror** as fallback. ČÚZK fills the interface tables ("v
  kompetenci ČÚZK", CR l.162/427); `AX_MIGRACE_SKO` is *their* role. One-shot final handover
  ~start of 2027, then frozen (Q-delivery).
- F3. **Coverage — verified a non-issue.** The Voronoi is built **only from `area.addresses`**
  (each cell labeled with its area); `municipality.unmappedPoints` is never fed into
  `polygons.ts`. So every cell is labeled and the cells tile the whole obec — no coverage gap
  from unmapped points. *Minor data-quality check (≠ coverage), fold into F1:* an area whose
  addresses are **all** null-coord is dropped (`addPoint` skips null lat/lng) → its ŠO would
  have no okrsek (MI04 risk).

---

## 4. Parked internal questions ❓ (not ČÚZK)

- ~~**OPEN-1:** empty disjoint polygons~~ — **RESOLVED (see §7).** Cause reproduced (§4):
  convex cells (whole-world bbox) clipped to a non-convex boundary; far component has no
  generator. Resolution = **face-merge** (drop the pointless seam, neighbor absorbs the land)
  per district *before* combining; seams via **segment-level dedup**. Same merge fixes the
  renderer (also handle the missing null-guard after `intersect`, `polygons.ts` l.280–287).
- ~~**OPEN-2:** `extraAreas` / cross-obec code~~ — **RESOLVED (see §8).** `extraAreas` is
  cross-*district* within one city (never cross-obec); cross-obec is only whole-obec village
  inclusion → `MIG_VYMEZENI_ZBYLYCH_KO`.
- ~~**OPEN-3:** unmapped-address-point coverage gaps~~ — **closed**: verified non-issue
  (unmapped points never enter the Voronoi). See F3.

---

## 5. Critical path

Nothing is hard-blocked anymore. Order of work:

1. **Parts A + B + F1** — full M/1.st relational export with self-validation; pure data work,
   no geometry.
2. **Part C (C1 refactor first)** — the geometry export; all design settled, GPKG/5514/cm
   confirmed. C1 is the one shared refactor everything else hangs off.
3. **Part E** — derive 2.st by copying the 1.st partition (type-`2` okrsky, orphan where no
   grades 6–9). *(F3 coverage verified a non-issue — no work needed.)*
4. **Part D (Prague pooling in A5 first, then cross-obec)** — A5 needed for the big cities;
   D2/D3 only for genuine cross-obec catchments.
5. **Dry run → F1 self-check → first GPKG handover** for a sample obec to validate MI10 +
   endpoint snapping before scaling up.

---

## 6. Part C — ticket-sized breakdown (geometry export)

The architectural heart. Ordered; each has a clear acceptance criterion. All operate on
`text-to-map/src/street-markdown/polygons.ts`.

- **C-1 · Expose the labeled cell layer.** Extract `buildLabeledCells(municipality,
  extraAreas)` returning the Voronoi cell `FeatureCollection` with `{ areaIndexes, index,
  neighbors, generator }` per cell (today computed inline as `polygons` and discarded).
  Refactor `createPolygons` to consume it. **Done when:** renderer output is byte-identical
  (snapshot test) and the new function is unit-tested on a 2-area fixture.
- **C-2 · Per-area clipped regions.** Dissolve labeled cells by `areaIndexes` *set*; clip
  each region to its **municipality boundary** — the *district* boundary for Praha / Ostrava /
  Plzeň / Liberec, never the pooled city — and split into connected polygon components.
  **Done when:** a 2-area fixture yields each area's clipped components; an `{A,B}` overlap
  stays one region carrying both indexes.
- **C-3 · Empty-fragment merge (OPEN-1, see §7).** Per municipality/district, classify each
  component (≥1 of its area's addresses = real, else empty) and merge every empty into the
  adjacent okrsek with the **longest shared boundary** (tie → stable pre-code key; iterate if
  an empty borders only empties). **Done when:** the §1/§4 repro fragment is absorbed (no
  generator-less component remains) and every okrsek is a single polygon with ≥1 address.
- **C-4 · Combine + seam derivation by segment dedup (see §7).** Combine districts → tag
  `OBEC_KOD`; snap all vertices to the cm grid; key every okrsek-boundary segment by sorted
  endpoints. Segment owned by **2** okrsky → interior seam (`KO_KOD1/KO_KOD2`), contiguous
  same-pair segments chained into one `MIG_HRAN_KO` polyline; owned by **1** → outer obec edge
  → **skip** (ČÚZK-generated). **Done when:** every seam appears once with one
  `(KO_KOD1,KO_KOD2)`, no segment lies outside the obec, and district-line seams pair
  automatically.
- **C-5 · Def-point selection.** One interior address per okrsek (nearest the centroid).
  Because empties are absorbed (C-3), every okrsek has a real address — **no synthetic
  points**. Emit single-point `MIG_DEF_BOD_KO`. **Done when:** every okrsek has ≥1 def point,
  each strictly inside.
- **C-6 · Deterministic codes.** Assign `KOD`/`CISLO` to okrsky from (obec_kod + type +
  component key); shared with B4. **Done when:** re-running on unchanged input yields
  identical codes.
- **C-7 · GeoPackage serialization.** Hand-roll a GeoPackage writer over `better-sqlite3`
  (already a dep): `MIG_DEF_BOD_KO` (points) + `MIG_HRAN_KO` (lines) as spatial layers, the
  descriptive `MIG_*` as non-spatial attribute tables, all in **WGS-84 (EPSG:4326)** — ČÚZK
  reprojects to 5514 via GDAL. Emit a CSV mirror too. **Done when:** GDAL/`ogr2ogr` opens the
  `.gpkg`, lists every table, and reports the layer geometry types + CRS.
- **C-8 · Dry run on one complex obec.** End-to-end on a real multi-school obec → F1
  self-check → hand the GPKG to ČÚZK to validate MI10 reassembly + endpoint snapping.
  **Done when:** MI10 passes on the sample without manual fixes.

Dependency chain: **C-1 → C-2 → C-3 → {C-4, C-5} → C-6 → C-7 → C-8.** C-1 is the only shared
refactor; everything else is additive and the renderer keeps working throughout.

---

## 7. OPEN-1 resolved — empty fragments, per-district clip & seam derivation

**Artifact (reproduced, §4):** convex Voronoi cells (whole-world bbox) clipped to a
*non-convex* boundary split into components; the far component holds **no generator** — an
"empty" polygon. **Resolution = face-merge:** drop the pointless seam so a neighbor absorbs
the empty land. No coverage gap, no synthetic def points, okrsky stay single-polygon.

**Pipeline (per type; per *district* for Praha / Ostrava / Plzeň / Liberec):**

1. Voronoi over the district's addresses; clip each area-set region to the **district**
   boundary (never the pooled city). `extraAreas` is the *only* sanctioned cross-boundary
   case (→ OPEN-2).
2. Split each region into connected components; a component with ≥1 of its area's addresses =
   **real**, else **empty**.
3. Merge each empty component into the adjacent okrsek with the **longest shared boundary**
   (tie → stable pre-code key: lowest area index, then component min-corner x/y — codes aren't
   minted until C-6; iterate if an empty borders only empties). Now every okrsek is a single
   polygon with ≥1 address.
4. **Only then** combine districts → tag `OBEC_KOD = <city>`. Resolving empties *before*
   combining is load-bearing — it stops a Prague-5 empty fragment merging into Prague-6.

**Seams + def points (segment-level dedup — one mechanism for every seam kind):**

- Snap all okrsek vertices to the cm grid (EPSG:5514) so shared edges coincide exactly.
- Break each okrsek boundary into segments keyed by sorted endpoints:
  - owned by **2** okrsky → interior seam; chain contiguous same-pair segments → one
    `MIG_HRAN_KO` polyline with `KO_KOD1/KO_KOD2`;
  - owned by **1** okrsek → outer obec edge → **skip** (ČÚZK generates it).
- **District-line seams pair automatically** (each segment owned by one okrsek from each
  district), unifying them with Voronoi seams and empty-merged boundaries — consideration #1
  solved with no spatial join.
- Def point = one interior address per okrsek (nearest centroid). Empties absorbed ⇒ always a
  real address.

**Renderer vs export:** same merge. Renderer keeps per-district clipping (hard boundaries) and
benefits (no white gaps, simpler shapes); export re-tags to one obec.

**Notes / risks:**

- District-line seams use the **full RÚIAN cadastral polyline** — the CR requires
  *non-generalized* hrany, so do **not** simplify.
- If adjacent districts' RÚIAN boundaries don't share identical vertices, the cm-grid snap
  reconciles them; verify in the C-8 dry run.

---

## 8. OPEN-2 resolved — cross-district vs cross-obec

Two SMD mechanisms, scope confirmed with the team:

**A. Cross-district — `extraAreas`** (`processMunicipalitySwitchLine` + stamped street points
→ `getExtraAreas`, `polygons.ts:131`). **Districts of one city only** (Prague / Ostrava /
Plzeň / Liberec), never separate obce, always one batch. Under Q3 (city = one obec) every
`extraAreas` piece is therefore *within a single obec*: a school reaching from district X into
district Y just yields another okrsek (its area-set) in Y, and both the X- and Y-okrsky link
to the same ŠO via `MIG_SKO_KO`. §7's per-district processing already produces this — **the
export simply never runs `addExtraPolygons`** (the renderer-only union of a school's pieces);
the X|Y district-line seam between the pieces is emitted by §7 segment-dedup.

**B. Cross-obec — whole-obec inclusion** (`processWholeMunicipalityLine`, `smd.ts:334`). A
small village (own obec, not a founder) fully spádová to one school: its points are added to
the school's area **unstamped**, and the village's code is pushed to `cityCodes`/
`districtCodes`. **Frequent.** → emit `MIG_VYMEZENI_ZBYLYCH_KO(village_obec, ŠO_of_school)`;
ČÚZK generates the whole-village okrsek and links it to the ŠO.

*Attribution (village obec → which school's ŠO).* The link is **not** in the current output:
`cityCodes` is Municipality-level (records *that* a village was absorbed, not *by which*
school), and whole-obec points are added unstamped, so an area's addresses carry no obec
marker. **Capture it at parse time instead of reconstructing it.** `processWholeMunicipalityLine`
has both the current area (the school) and the absorbed municipality in hand at `smd.ts:357`,
so record the pairing directly — e.g. an `absorbedWholeObce: number[]` on the `Area` (or an
`areaIndex → obecCode[]` map on the `Municipality`). The migration then reads
`area.absorbedWholeObce` and emits the rows — no post-hoc obec-per-address lookup. Small,
contained addition in `text-to-map`. *(Fallback if we ever can't touch the parser: group an
area's addresses by their DB obec; any obec ≠ home wholly inside one area = that school's
inclusion.)*

**Not exercised by our data:**

- **Street-level cross-obec** — mechanism A is districts-only.
- **Part-level cross-boundary** — disallowed in practice (it breaks the result polygons), and
  `smd.ts:436` drops the foreign stamp anyway.

So the CR's general cross-obec geometry/skip machinery never fires for us; cross-obec is
always the trivial whole-obec form (B).
