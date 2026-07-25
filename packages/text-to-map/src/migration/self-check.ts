import { MigrationExport } from "./types";

/**
 * Structural integrity checks over a {@link MigrationExport} — the referential /
 * cardinality invariants we can verify on our side before handover. This is the
 * seed of the full MI01–MI14 harness (F1); the geometric checks that need
 * ČÚZK's reassembly (MI10 whole-obec coverage) stay their responsibility.
 *
 * Returns a list of human-readable problems; empty means the checks passed.
 */
export const checkIntegrity = (data: MigrationExport): string[] => {
  const problems: string[] = [];

  const obvodKods = new Set(data.obvody.map((o) => o.KOD));
  const okrsekKods = new Set(data.okrsky.map((o) => o.KOD));
  const okrsekType = new Map(data.okrsky.map((o) => [o.KOD, o.TYP_OBVODU_KOD]));
  const obvodType = new Map(data.obvody.map((o) => [o.KOD, o.TYP_OBVODU_KOD]));

  // MI09-ish: exactly one def point per okrsek.
  const defByKo = new Map<number, number>();
  for (const d of data.defBody) {
    defByKo.set(d.KO_KOD, (defByKo.get(d.KO_KOD) ?? 0) + 1);
    if (!okrsekKods.has(d.KO_KOD)) {
      problems.push(`MIG_DEF_BOD_KO ${d.ID}: unknown KO_KOD ${d.KO_KOD}`);
    }
  }
  for (const kod of okrsekKods) {
    const n = defByKo.get(kod) ?? 0;
    if (n !== 1) {
      problems.push(`okrsek ${kod}: expected 1 def point, found ${n}`);
    }
  }

  // CISLO unique within an obec.
  const cisloSeen = new Set<string>();
  for (const o of data.okrsky) {
    const key = `${o.OBEC_KOD}/${o.CISLO}`;
    if (cisloSeen.has(key)) {
      problems.push(`duplicate CISLO ${o.CISLO} in obec ${o.OBEC_KOD}`);
    }
    cisloSeen.add(key);
  }

  // MIG_SKO_KO references resolve, and type matches on both sides.
  for (const link of data.skoKo) {
    if (!obvodKods.has(link.SKO_KOD)) {
      problems.push(`MIG_SKO_KO: unknown SKO_KOD ${link.SKO_KOD}`);
    }
    if (!okrsekKods.has(link.KO_KOD)) {
      problems.push(`MIG_SKO_KO: unknown KO_KOD ${link.KO_KOD}`);
    }
    // MI02-ish: okrsek type must match its obvod type.
    const ot = obvodType.get(link.SKO_KOD);
    const kt = okrsekType.get(link.KO_KOD);
    if (ot && kt && ot !== kt) {
      problems.push(
        `MIG_SKO_KO: type mismatch obvod ${link.SKO_KOD} (${ot}) vs okrsek ${link.KO_KOD} (${kt})`
      );
    }
  }

  // Every obvod is linked to at least one okrsek OR covered whole-obec.
  const wholeObecObvody = new Set(
    data.vymezeni.map((v) => v.SKO_KOD).filter((k): k is number => k !== null)
  );
  const linkedObvody = new Set(data.skoKo.map((l) => l.SKO_KOD));
  for (const kod of obvodKods) {
    if (!linkedObvody.has(kod) && !wholeObecObvody.has(kod)) {
      problems.push(`obvod ${kod}: no okrsek and no whole-obec vymezeni (MI04 risk)`);
    }
  }

  // Seams reference two distinct, existing okrsky.
  for (const h of data.hrany) {
    if (h.KO_KOD1 === h.KO_KOD2) {
      problems.push(`MIG_HRAN_KO ${h.ID}: self-seam ${h.KO_KOD1}`);
    }
    for (const k of [h.KO_KOD1, h.KO_KOD2]) {
      if (!okrsekKods.has(k)) {
        problems.push(`MIG_HRAN_KO ${h.ID}: unknown okrsek ${k}`);
      }
    }
  }

  // MIG_SKOLA_SKO references an existing obvod.
  for (const s of data.skolaSko) {
    if (!obvodKods.has(s.SKO_KOD)) {
      problems.push(`MIG_SKOLA_SKO: unknown SKO_KOD ${s.SKO_KOD}`);
    }
  }

  return problems;
};
