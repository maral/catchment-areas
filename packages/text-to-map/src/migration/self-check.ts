import { SchoolTypeCode, TridaFlag, MigrationExport } from "./types";

/** Optional external registries for the checks that reference ČÚZK master data. */
export interface CheckOptions {
  /** Valid obec codes (MI01). Omitted → obec-code existence is left to ČÚZK. */
  knownObecKods?: Set<number>;
  /** Valid school IZOs from IF_REGISTR_SKOL (MI07). Omitted → left to ČÚZK. */
  knownIzos?: Set<number>;
}

/**
 * Self-check harness (F1): replicates the CR0025 pre-migration checks
 * **MI01–MI14** (`data-migration/CR0025.md` §"Kontrola dat") against a
 * {@link MigrationExport}, as far as each is verifiable on our side before
 * handover. Each block is tagged with its MI code and follows the CR wording.
 *
 * Two checks depend on ČÚZK master data we don't hold and are only run when the
 * matching registry is supplied via {@link CheckOptions}: **MI01** (obec codes)
 * and **MI07** (school registry). **MI10** (topological reassembly of each okrsek
 * polygon from its seams + def point + the obec's outer boundary) is inherently
 * ČÚZK-side — it needs the RÚIAN obec boundary we deliberately don't ship — so we
 * assert only its combinatorial preconditions (MI03/MI08 references + no
 * degenerate seam geometry).
 *
 * ⚠ **MI02 divergence.** CR0025 MI02 literally requires *every* okrsek to carry a
 * same-type ŠO link. ČÚZK relaxed this for us (`SKO_MIGRATION_PLAN.md` §1 Q1):
 * orphan okrsky are allowed, which Part E (2.stupeň) relies on. We therefore
 * check only the always-required half — that a link, *where present*, is
 * same-type — and never flag an orphan okrsek. See {@link countOrphanOkrsky} if
 * you want the orphan tally.
 *
 * Returns human-readable problems; empty means the checks passed.
 */
export const checkIntegrity = (
  data: MigrationExport,
  options: CheckOptions = {}
): string[] => {
  const problems: string[] = [];

  const obvodKods = new Set(data.obvody.map((o) => o.KOD));
  const okrsekKods = new Set(data.okrsky.map((o) => o.KOD));
  const okrsekType = new Map(data.okrsky.map((o) => [o.KOD, o.TYP_OBVODU_KOD]));
  const obvodType = new Map(data.obvody.map((o) => [o.KOD, o.TYP_OBVODU_KOD]));

  // === MI01 — every OBEC_KOD in okrsek / obvod / vymezeni exists. ===========
  // Registry membership is ČÚZK's; without it we at least require a populated,
  // positive code on all three tables.
  for (const [table, kods] of [
    ["MIG_SKOLSKY_OKRSEK", data.okrsky.map((o) => o.OBEC_KOD)] as const,
    ["MIG_SKOLSKY_OBVOD", data.obvody.map((o) => o.OBEC_KOD)] as const,
    ["MIG_VYMEZENI_ZBYLYCH_KO", data.vymezeni.map((v) => v.OBEC_KOD)] as const,
  ]) {
    for (const kod of kods) {
      if (!Number.isInteger(kod) || kod <= 0) {
        problems.push(`MI01: ${table} has invalid OBEC_KOD ${kod}`);
      } else if (options.knownObecKods && !options.knownObecKods.has(kod)) {
        problems.push(`MI01: ${table} OBEC_KOD ${kod} not in obec registry`);
      }
    }
  }

  // === MI02 — a KO↔ŠO link, where present, is the same type. ================
  // (CR-literal "every okrsek must be linked" is relaxed per §1 Q1 — see above.)
  for (const link of data.skoKo) {
    const ot = obvodType.get(link.SKO_KOD);
    const kt = okrsekType.get(link.KO_KOD);
    if (ot && kt && ot !== kt) {
      problems.push(
        `MI02: type mismatch obvod ${link.SKO_KOD} (${ot}) vs okrsek ${link.KO_KOD} (${kt})`
      );
    }
  }

  // === MI03 — every MIG_SKO_KO.KO_KOD resolves to an okrsek. =================
  for (const link of data.skoKo) {
    if (!okrsekKods.has(link.KO_KOD)) {
      problems.push(`MI03: MIG_SKO_KO references unknown okrsek KO_KOD ${link.KO_KOD}`);
    }
  }

  // === MI04 — every ŠO has ≥1 okrsek link OR whole-obec coverage. ===========
  const wholeObecObvody = new Set(
    data.vymezeni.map((v) => v.SKO_KOD).filter((k): k is number => k !== null)
  );
  const linkedObvody = new Set(data.skoKo.map((l) => l.SKO_KOD));
  for (const kod of obvodKods) {
    if (!linkedObvody.has(kod) && !wholeObecObvody.has(kod)) {
      problems.push(`MI04: obvod ${kod} has no okrsek and no whole-obec vymezeni (MI04 risk)`);
    }
  }

  // === MI05 — every ŠO referenced in SKO_KO / vymezeni exists in obvod. ======
  for (const link of data.skoKo) {
    if (!obvodKods.has(link.SKO_KOD)) {
      problems.push(`MI05: MIG_SKO_KO references unknown SKO_KOD ${link.SKO_KOD}`);
    }
  }
  for (const v of data.vymezeni) {
    if (v.SKO_KOD !== null && !obvodKods.has(v.SKO_KOD)) {
      problems.push(`MI05: MIG_VYMEZENI_ZBYLYCH_KO references unknown SKO_KOD ${v.SKO_KOD}`);
    }
  }

  // === MI06 — every ŠO has ≥1 school link in MIG_SKOLA_SKO. ==================
  const schoolsByObvod = groupBy(data.skolaSko, (s) => s.SKO_KOD);
  for (const kod of obvodKods) {
    if (!schoolsByObvod.has(kod)) {
      problems.push(`MI06: obvod ${kod} has no MIG_SKOLA_SKO school link`);
    }
  }

  // === MI07 — every SKOLA_IZO exists in the school registry. ================
  if (options.knownIzos) {
    for (const s of data.skolaSko) {
      if (!options.knownIzos.has(s.SKOLA_IZO)) {
        problems.push(`MI07: MIG_SKOLA_SKO school IZO ${s.SKOLA_IZO} not in registry`);
      }
    }
  }

  // === MI08 — every KO_KOD in def points / seams resolves to an okrsek. ======
  for (const d of data.defBody) {
    if (!okrsekKods.has(d.KO_KOD)) {
      problems.push(`MI08: MIG_DEF_BOD_KO ${d.ID} references unknown okrsek ${d.KO_KOD}`);
    }
  }
  for (const h of data.hrany) {
    for (const k of [h.KO_KOD1, h.KO_KOD2]) {
      if (!okrsekKods.has(k)) {
        problems.push(`MI08: MIG_HRAN_KO ${h.ID} references unknown okrsek ${k}`);
      }
    }
  }

  // === MI09 — every okrsek has ≥1 def point (CR: "alespoň jeden"). ===========
  const defByKo = new Map<number, number>();
  for (const d of data.defBody) {
    defByKo.set(d.KO_KOD, (defByKo.get(d.KO_KOD) ?? 0) + 1);
  }
  for (const kod of okrsekKods) {
    if ((defByKo.get(kod) ?? 0) === 0) {
      problems.push(`MI09: okrsek ${kod} has no def point`);
    }
  }

  // === MI11 — every obec in the migration is covered per type. ===============
  // For each (obec, type) that appears (as an obvod or okrsek), there must be an
  // okrsek of that type OR a whole-obec vymezeni row for that obec.
  const vymezeniByObec = new Set(data.vymezeni.map((v) => v.OBEC_KOD));
  const okrskyByObecType = new Set(
    data.okrsky.map((o) => `${o.OBEC_KOD}/${o.TYP_OBVODU_KOD}`)
  );
  const obecTypePairs = new Set<string>([
    ...data.obvody.map((o) => `${o.OBEC_KOD}/${o.TYP_OBVODU_KOD}`),
    ...okrskyByObecType,
  ]);
  for (const pair of obecTypePairs) {
    const [obecStr, type] = pair.split("/");
    const obec = Number(obecStr);
    if (!okrskyByObecType.has(pair) && !vymezeniByObec.has(obec)) {
      problems.push(`MI11: obec ${obec} type ${type} has no okrsek and no whole-obec coverage`);
    }
  }

  // === MI12 — no two same-type ŠO with the same school set + class ranges. ===
  const mi12Seen = new Map<string, number>();
  for (const kod of obvodKods) {
    const type = obvodType.get(kod)!;
    const sig =
      `${type}|` +
      (schoolsByObvod.get(kod) ?? [])
        .map(
          (s) =>
            `${s.SKOLA_IZO}:${[1, 2, 3, 4, 5, 6, 7, 8, 9]
              .map((g) => s[`TRIDA_${g}` as keyof typeof s])
              .join("")}`
        )
        .sort()
        .join(",");
    const prev = mi12Seen.get(sig);
    if (prev !== undefined) {
      problems.push(`MI12: duplicate ŠO (type ${type}, same schools + grades): obvody ${prev}, ${kod}`);
    } else {
      mi12Seen.set(sig, kod);
    }
  }

  // === MI13 — a school's class range fits its ŠO type (M none, 1st 1–5, 2nd 6–9). ==
  for (const s of data.skolaSko) {
    const type = obvodType.get(s.SKO_KOD);
    if (!type) continue;
    const band = TYPE_BANDS[type];
    for (let grade = 1; grade <= 9; grade++) {
      const flag = s[`TRIDA_${grade}` as keyof typeof s] as TridaFlag;
      if (flag === "A" && !band.includes(grade)) {
        problems.push(
          `MI13: MIG_SKOLA_SKO ${s.SKO_KOD}/${s.SKOLA_IZO} flags grade ${grade} outside type ${type} band`
        );
      }
    }
  }

  // === MI14 — no two same-type ŠO with an identical set of linked okrsky. =====
  // Whole-obec ŠO (no linked okrsek — covered by vymezeni) are exempt: an empty
  // okrsek set is not a shared "vymezení" in MI14's sense.
  const okrskyByObvod = groupBy(data.skoKo, (l) => l.SKO_KOD);
  const mi14Seen = new Map<string, number>();
  for (const kod of obvodKods) {
    const kos = (okrskyByObvod.get(kod) ?? []).map((l) => l.KO_KOD);
    if (kos.length === 0) continue;
    const type = obvodType.get(kod)!;
    const sig = `${type}|${[...new Set(kos)].sort((a, b) => a - b).join(",")}`;
    const prev = mi14Seen.get(sig);
    if (prev !== undefined) {
      problems.push(`MI14: duplicate ŠO vymezení (type ${type}, same okrsky): obvody ${prev}, ${kod}`);
    } else {
      mi14Seen.set(sig, kod);
    }
  }

  // === Additional internal invariants (beyond MI01–14) ======================
  // Deterministic code minting -> KODs must be globally unique; a collision is an
  // allocator regression. CISLO is unique within an obec+type (C2). Def-point /
  // seam geometry must be finite and non-degenerate (MI10 precondition, F3).
  for (const [label, kods] of [
    ["obvod", data.obvody.map((o) => o.KOD)] as const,
    ["okrsek", data.okrsky.map((o) => o.KOD)] as const,
  ]) {
    const seen = new Set<number>();
    for (const kod of kods) {
      if (seen.has(kod)) problems.push(`duplicate ${label} KOD ${kod}`);
      seen.add(kod);
    }
  }
  const cisloSeen = new Set<string>();
  for (const o of data.okrsky) {
    const key = `${o.OBEC_KOD}/${o.TYP_OBVODU_KOD}/${o.CISLO}`;
    if (cisloSeen.has(key)) {
      problems.push(`duplicate CISLO ${o.CISLO} in obec ${o.OBEC_KOD} type ${o.TYP_OBVODU_KOD}`);
    }
    cisloSeen.add(key);
  }
  for (const kod of okrsekKods) {
    const n = defByKo.get(kod) ?? 0;
    if (n > 1) problems.push(`okrsek ${kod}: expected exactly 1 def point, found ${n}`);
  }
  for (const d of data.defBody) {
    if (!isFiniteCoord(d.geometry.coordinates)) {
      problems.push(`MIG_DEF_BOD_KO ${d.ID}: non-finite coordinate`);
    }
  }
  for (const h of data.hrany) {
    if (h.KO_KOD1 === h.KO_KOD2) {
      problems.push(`MIG_HRAN_KO ${h.ID}: self-seam ${h.KO_KOD1}`);
    }
    const coords = h.geometry.coordinates;
    if (coords.length < 2 || !coords.every(isFiniteCoord)) {
      problems.push(`MIG_HRAN_KO ${h.ID}: degenerate geometry`);
    }
  }

  return problems;
};

/**
 * Okrsky with no same-type ŠO link — allowed by ČÚZK (§1 Q1) but flagged by a
 * CR-literal MI02. Exposed so a caller can report the tally without treating it
 * as an error. See the MI02 note in {@link checkIntegrity}.
 */
export const countOrphanOkrsky = (data: MigrationExport): number => {
  const linkedKo = new Set(data.skoKo.map((l) => l.KO_KOD));
  return data.okrsky.filter((o) => !linkedKo.has(o.KOD)).length;
};

/** Grades a MIG_SKOLA_SKO row of a given obvod type may flag `A` (MI13). */
const TYPE_BANDS: Record<SchoolTypeCode, number[]> = {
  M: [],
  "1": [1, 2, 3, 4, 5],
  "2": [6, 7, 8, 9],
};

const groupBy = <T, K>(rows: T[], key: (row: T) => K): Map<K, T[]> => {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const bucket = map.get(k);
    if (bucket) bucket.push(row);
    else map.set(k, [row]);
  }
  return map;
};

const isFiniteCoord = (coord: number[]): boolean =>
  coord.length >= 2 && coord.every((n) => Number.isFinite(n));
