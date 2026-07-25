# Migration geometry demo / visualiser

A runnable debugging tool for the ŠO → ISÚI migration export. It parses an
ordinance, runs the real export pipeline (`buildMigrationExport`), and writes a
**standalone HTML map** — no server, no external assets — that overlays:

- **Catchment areas** — the polygons the app renders today (`municipalitiesToPolygons`).
- **Interior seams** — the generated `MIG_HRAN_KO` lines.
- **Definition points** — the generated `MIG_DEF_BOD_KO`, one per okrsek.
- **Schools** — with IZO labels.

The map has layer toggles, pan/zoom, and a hover readout (seam → `okrsek A ↔ B`,
def point → okrsek + coords, school → name/address).

## Run

```bash
# from anywhere in the repo
npm run -w text-to-map demo                            # Česká Lípa, elementary (zs)
npm run -w text-to-map demo -- ms                      # kindergarten
npm run -w text-to-map demo -- zs path/to/vyhlaska.txt # any ordinance file
```

It reads the DB connection from the repo-root **`.env.local`** (the dev server by
default), so a synced DB must be reachable. The command prints a `file://` path —
open it in a browser.

Output lands in `demo/out/` (git-ignored): `<name>.html` (self-contained) and
`<name>-data.json` (the raw layer data, handy for scripted checks).

## What to eyeball

- Every colored region should contain **exactly one** definition point.
- Seams should trace **only interior borders** between adjacent okrsky — never the
  outer municipal edge (those are ČÚZK-generated).
- A school that owns several disjoint patches shows as **multiple okrsky / def
  points** sharing that school's colour.

## Files

- `generate.ts` — parses + runs the export + injects data into the template.
- `template.html` — the visualiser (a `/*__DATA__*/` placeholder is replaced with
  the run's layer data). Edit here to change the map itself.
