# CLAUDE.md

Guidance for working in this repo.

## Repo shape

Monorepo (npm workspaces). The Next.js catchment-areas app lives at the root; the
`text-to-map` library lives at `packages/text-to-map` and is consumed locally. **All
CR0025 ŠO → ISÚI migration/export code lives in `text-to-map`** — it owns the open-data
DB (address points, city/district boundaries, schools), the street-markdown parser, and
the geometry pipeline. The app only supplies the active street-markdown + founder/type and
triggers the run.

Run the library's tests from the package: `npm test -w text-to-map -- <filter>`
(a manual `jest` invocation breaks the ESM tsconfig path resolution).

## The migration docs — how to use them

The migration docs live in **`data-migration/`**. Keep them in their lanes:

- **`data-migration/CR0025.md`** — the *authoritative ČÚZK source*: the CR spec itself,
  including the MI01–MI14 pre-migration checks (§"Kontrola dat") and the `MIG_*` interface.
  Read-only reference — the ground truth when a rule's exact wording matters.

- **`data-migration/SKO_MIGRATION_PLAN.md`** — the *design / rationale* record. Why each
  decision was made, the resolved ČÚZK Q&A, the MIG_* table model, OPEN-1/2/3 resolutions
  (§7/§8), and the ticket-level acceptance criteria (§6). Source of truth for *how* and *why*
  (and for where we deliberately diverge from CR0025 — e.g. the MI02 orphan-okrsek relaxation).
  Edit it when a decision changes or a new question is resolved — not for day-to-day status.

- **`data-migration/IMPLEMENTATION_PLAN.md`** — the *execution tracker*. An ordered, checkable
  task list mirroring the plan's work breakdown, marking what's done (with commit hashes) and
  what's next. Edit it whenever a task's status changes. It carries no rationale — link back to
  `SKO_MIGRATION_PLAN.md` for that.

- **`ARCHITECTURE.md`** (repo root) — how the app + library fit together, for onboarding.

**Workflow:** pick the next unchecked task from `data-migration/IMPLEMENTATION_PLAN.md`, in
order; read its acceptance criteria in `SKO_MIGRATION_PLAN.md` (and the MI rules in `CR0025.md`
when relevant); implement + test; commit per ticket; then tick it in `IMPLEMENTATION_PLAN.md`
with the commit hash. If a decision has to change mid-flight, update `SKO_MIGRATION_PLAN.md`
first (the why), then reflect the task change in `IMPLEMENTATION_PLAN.md`.

## Committing

Commit locally **per ticket**; do **not** push after each one — pushes go in batches when
the user asks. Work happens on the `cuzk-export` branch.
