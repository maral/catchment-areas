# Architecture Overview

This document gives a brief, end-to-end picture of how the **catchment-areas** project
works, including its relationship to the **text-to-map** library. For precise domain
vocabulary see [UBIQUITOUS_LANGUAGE.md](./UBIQUITOUS_LANGUAGE.md); for usage see
[README.md](./README.md).

## What the system does

The goal is to turn Czech municipal **ordinances** (*vyhlášky*) — legal PDFs/DOCs that
define school **catchment areas** (*spádové oblasti*) — into machine-readable **geodata**
that can be rendered on a public map. A catchment area is, at its core, *a set of address
points assigned to one school*. The whole pipeline exists to get from "scanned legal
prose" to "every address point in the country mapped to its school, drawn as a polygon".

## Two repositories, one pipeline

```txt
                catchment-areas (this repo, Next.js app)
   ┌──────────────────────────────────────────────────────────────┐
   │  Ordinance import  →  text extraction/OCR  →  GPT preprocess   │
   │        ↓                                                       │
   │  street-markdown editor (Monaco)  →  StreetMarkdown records    │
   │        ↓ (on "Active")                                         │
   │  parse + map points  ─────────────┐                           │
   │        ↓                          │ uses                      │
   │  MapData (json_data + polygons)   │                           │
   │        ↓                          ▼                           │
   │  public Leaflet map        text-to-map (NPM library)          │
   └──────────────────────────────────────────────────────────────┘
```

- **text-to-map** (`/root/projects/text-to-map`, published as the `text-to-map` NPM
  package) is a standalone TypeScript library. It owns: (a) open-data sync from Czech
  state registries, and (b) the **street-markdown** grammar/parser and geodata
  generation. It is the "engine".
- **catchment-areas** (this repo) is a Next.js 15 app that wraps the library with a UI,
  database persistence, authentication, document ingestion, and the public map. It is the
  "product".

The two live in **one npm-workspaces monorepo**: the Next app is the repo root and the
library sits at `packages/text-to-map`, linked locally (so the app always builds against the
current library source — no publish step). They stay deliberately decoupled by the **package
boundary** (the app depends on `text-to-map` by name and only through its public exports), and
the library remains independently buildable, testable, and publishable.

## street-markdown: the intermediate format

street-markdown (SMD) is a Markdown-inspired plain-text format that encodes catchment
boundaries in human-readable Czech, e.g.:

```txt
# Praha 1

Základní škola Brána jazyků
náměstí Míru
Rašínovo nábřeží - lichá č. 1-9, 11, od 23 výše
```

`#` lines name a **municipality**; each blank-line-separated block is a **school** followed
by **street definitions** with optional **number-range specifications** (all/odd/even,
ranges, "and above", descriptive vs. orientational numbers). It is intentionally close to
the format Prague already used, and is extensible to other ordinance types.

The parser is built with [chevrotain](https://chevrotain.io/) (lexer + parser). Key files
in the library:

- `src/street-markdown/token-definition.ts`, `smd-line-parser.ts`, `smd-parser.ts` — lexing/parsing of a single line.
- `src/street-markdown/smd.ts` — `parseOrdinanceToAddressPoints(...)`: the top-level pass that walks all lines, resolves streets/municipality parts against the DB, and emits address points per area.
- `src/street-markdown/municipality.ts` — "rest of municipality / municipality part" handling and whole-municipality rules.
- `src/street-markdown/types.ts` — the core output types (see below).
- `src/street-markdown/polygons.ts` — converts mapped points into polygons.

## Core data types (text-to-map)

From `src/street-markdown/types.ts`:

- **`Municipality`** — a city or district as a geodata unit: `code`, `municipalityType`
  (`"city" | "district"`), `cityCodes`/`districtCodes`, an array of **`Area`s**, and any
  `unmappedPoints`.
- **`Area`** (= a **catchment area**) — `index`, the `schools` it serves, and the
  `addresses` (`ExportAddressPoint[]`) belonging to it.
- **`School`** — `name`, `izo`, optional position.
- **`ExportAddressPoint` / `AddressPoint`** — a geocoded address with `lat`/`lng`; the
  smallest assignable unit.

The parse output (`Municipality[]`) is exactly what the app caches as map data.

## From points to polygons

`municipalitiesToPolygons()` (`src/street-markdown/polygons.ts`) turns the discrete
address points of each area into filled polygons:

1. It loads official **city/district boundary polygons** from the synced open data.
2. It builds a **Delaunay/Voronoi** tessellation (`d3-delaunay`) over the area's address
   points, so each point claims the space around it.
3. Voronoi cells are clipped to the municipality boundary and unioned per area
   (`@turf/union`, `@turf/difference`), producing one polygon/multipolygon per catchment
   area.

This is the geometric heart of the system and the most relevant part when comparing
against external geometry models (e.g. boundary edges + definition points).

## Open-data sync (text-to-map)

`src/open-data-sync/*` downloads and imports the reference data everything else is mapped
against, into a Knex-managed SQLite DB (`src/db/*`):

- **address-points** — from RÚIAN (the address registry); the largest dataset, refreshed daily.
- **streets** — from RÚIAN (slow, ~1h; optional but removes "unknown street" warnings).
- **cities / regions** — administrative divisions + boundary polygons.
- **schools / founders** — from the MŠMT school registry (`izo`/`redizo`, capacity, type, founder).

`downloadAndImportEverything()` in `src/index.ts` orchestrates a full sync. The app
re-exposes these as `npm run` bin scripts (`address-points`, `schools`, `streets`, …).

## The Next.js application (catchment-areas)

### Data model (`src/entities/`, persisted via Remult + Knex)

- **`Region` → `City`** — administrative hierarchy; `City` carries aggregate school counts
  and per-school-type **catchment status** (`statusElementary`/`statusKindergarten`,
  `CityStatus`: `NoOrdinance` / `NoExistingOrdinance` / `InProgress` / `Published`).
- **`Founder`** — a city or city district that runs schools and issues ordinances. A
  backend prefilter only surfaces founders with 2+ schools (or any district).
- **`School`**, **`SchoolFounder`** — schools and the join to their founder.
- **`Ordinance`** — the imported legal document: city, school type, number, validity
  dates, `isActive`, and the extracted `originalText`.
- **`OrdinanceMetadata`** — a mirror of an entry in the public registry (*sbírka právních
  předpisů*), used to detect new/updated ordinances **before** an `Ordinance` exists.
  Distinct from `Ordinance`.
- **`StreetMarkdown`** — a versioned SMD text record tied to user/ordinance/founder, with
  a lifecycle **state** (`Initial` / `AutoSave` / `Draft` / `Active` / `Superseded`).
- **`MapData`** — the cached geodata for an ordinance: `jsonData` (`Municipality[]`) plus
  `polygons` (GeoJSON `FeatureCollection[]`), keyed by founder/ordinance/city.
- **`User` / `Account`** — auth identity and role (`User`/"Expert", `Editor`, `Admin`;
  cumulative).

### Persistence & API

- **Remult** provides the entity layer and auto-generates a REST API
  (`src/app/api/[...remult]`), callable directly from React Server Components and the
  client. Controllers in `src/controllers/*` hold the heavier server logic
  (`*ControllerServer.ts` = server-only).
- **Knex** is the query builder / migration tool. Production runs **MySQL**; PostgreSQL
  and SQLite are also supported. (Migrations currently live on the text-to-map side.)

### Authentication

Microsoft / Azure AD is the only sign-in provider, via **NextAuth.js**, bridged into
Remult through `src/app/api/auth/RemultAdapter.ts`. Sign-in is for editors/admins; the
public map needs no login.

### Document ingestion (the "magic" backend)

In `src/app/api/ordinances/*` and `src/bin/`:

1. Ordinances are pulled from the official registry (sbírkapp.gov.cz) in one click, or uploaded.
2. PDF/DOC(x) are converted to text — direct extraction or **Tesseract.js OCR** (Czech
   trained data `ces.traineddata`) for scans. RTF is not yet supported.
3. On first open, the raw text is **preprocessed with ChatGPT** (`openai`) to draft
   street-markdown — pulling out school names, streets, and municipality parts.

### Editor

The SMD editor uses **Monaco** (`src/components/editor/`): syntax highlighting, inline
error messages with fix suggestions, and completion. It validates via
`src/app/api/text-to-map/validate` against the library.

### Public map & frontend

- React Server Components do most async data work server-side; the client bundle stays small.
- UI is **shadcn/ui** (Radix + Tailwind).
- Maps use **Leaflet** (`src/components/map`, `publicMap`), rendering the cached
  `MapData.polygons`. Public routes live under `src/app/(public)/` (`[schoolType]`,
  `embed`, `s/[izo]`, `data`).

### Lifecycle in one sentence

An editor saves SMD → a new `StreetMarkdown` **Draft**; marking it **Active** supersedes
the previous active record, triggers a parse into `Municipality[]` + polygons, and
refreshes the cached `MapData` that the public map reads.

## Crons / scheduled work

Daily open-data sync (address points, streets) and registry ordinance sync are *intended*
to run as cron jobs but are currently **manual** bin scripts (`src/bin/*`, `npm run
address-points` / `schools` / `streets` / `sync-ordinances`).

## smd-to-csv (legacy/auxiliary)

`text-to-map/src/smd-to-csv/` is a small standalone JS utility that converts parsed
ordinance districts to CSV "rules" (`ordinance-to-csv-rules`, `json-to-csv`,
`txt-to-json`). It's separate from the main TS pipeline and notable as a precedent for
exporting catchment data to tabular/CSV formats.

## Glossary cross-reference

The deliberate naming split to keep in mind: the app DB uses **`City`** (*obec*) +
**`CityDistrict`**, while the library uses **`Municipality`** (with
`municipalityType: "district"`) for the same real-world thing; the library's **`Area`**
is the in-code form of a domain **catchment area**. "Status" is overloaded — `CityStatus`
(publishing progress) vs. `StreetMarkdownState` (document lifecycle) vs.
`OrdinanceMetadata` flags. See [UBIQUITOUS_LANGUAGE.md](./UBIQUITOUS_LANGUAGE.md).
