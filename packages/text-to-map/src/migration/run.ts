import {
  getCityCodesByDistrictCodes,
  getCityPolygons,
  getDistrictPolygons,
} from "../db/cities";
import { PolygonsByCodes, SchoolType } from "../db/types";
import {
  getMunicipalityBoundary,
  getMunicipalityCodes,
} from "../street-markdown/polygons";
import {
  getNewMunicipalityByFounderId,
  parseOrdinanceToAddressPoints,
} from "../street-markdown/smd";
import { Municipality } from "../street-markdown/types";
import { buildBigCityTables } from "./build-big-city";
import { buildObecTables, counter, ObecBuildContext } from "./build-obec";
import { dedupeExport } from "./dedupe";
import { checkIntegrity } from "./self-check";
import {
  MigrationExport,
  ObecTables,
  SchoolGrades,
  SchoolTypeCode,
} from "./types";

/**
 * Transient MySQL/socket error codes worth retrying — a dropped or timed-out
 * connection over a long batch, not a logical failure. Read-only work, so a
 * retry is always safe.
 */
const TRANSIENT_DB_ERRORS = new Set([
  "ETIMEDOUT",
  "PROTOCOL_CONNECTION_LOST",
  "PROTOCOL_SEQUENCE_TIMEOUT",
  "ECONNRESET",
  "EPIPE",
  "ECONNREFUSED",
]);

/**
 * Run `fn`, retrying it on a transient DB/connection error with exponential
 * backoff (1s, 2s, 4s…). On a fatal connection error knex discards the dead
 * pooled connection, so the retry acquires a fresh one. `fn` MUST be idempotent
 * — callers wrap a self-contained read (e.g. resolve+parse one ordinance) so a
 * retry starts from clean state, never a half-mutated one.
 */
export const withDbRetry = async <T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number, err: unknown) => void,
  attempts = 5,
  backoffMs: (attempt: number) => number = (a) => 1000 * 2 ** (a - 1)
): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      if (attempt >= attempts || !code || !TRANSIENT_DB_ERRORS.has(code)) {
        throw err;
      }
      onRetry?.(attempt, err);
      await new Promise((r) => setTimeout(r, backoffMs(attempt)));
    }
  }
};

/** Starting seeds for the deterministic, globally-unique code/id allocators. */
const OBVOD_KOD_START = 10001; // 5-digit space
const OKRSEK_KOD_START = 100001; // 6-digit space
const ID_START = 1;

export type GradesByIzo = (izo: string) => SchoolGrades | undefined;

/** Parsed municipalities that all export under one type code. */
export interface ExportGroup {
  municipalities: Municipality[];
  typeCode: SchoolTypeCode;
}

export interface RunOptions {
  typeCode: SchoolTypeCode;
  /** grades a school teaches (ČÚZK CSV); undefined => full band for the type */
  gradesByIzo?: GradesByIzo;
}

/**
 * Build the full {@link MigrationExport} for one type's parsed municipalities.
 * Thin wrapper over {@link buildMigrationExportForGroups}; kept for the
 * single-type callers (the `export-obec` dry run, tests).
 */
export const buildMigrationExport = (
  municipalities: Municipality[],
  options: RunOptions
): Promise<MigrationExport> =>
  buildMigrationExportForGroups(
    [{ municipalities, typeCode: options.typeCode }],
    options.gradesByIzo
  );

/**
 * Build one {@link MigrationExport} across several groups (types) of
 * municipalities. Fetches the clip boundaries for the union of all
 * municipalities once, then assembles every obec under **run-wide allocators**
 * so KOD/ID are globally unique across obce *and* types.
 *
 * NOTE: district-first cities (Praha/Ostrava/Plzeň/Liberec) still need the
 * per-district clip → empty-merge → combine flow (§7, P4-3). For plain
 * single-boundary obce this is complete.
 */
export const buildMigrationExportForGroups = async (
  groups: ExportGroup[],
  gradesByIzo?: GradesByIzo
): Promise<MigrationExport> => {
  const allMunicipalities = groups.flatMap((g) => g.municipalities);
  const { cityCodes, districtCodes } =
    getMunicipalityCodes(allMunicipalities);
  const [cityPolygons, districtPolygons, parentCityByDistrict] =
    await Promise.all([
      getCityPolygons(cityCodes),
      getDistrictPolygons(districtCodes),
      getCityCodesByDistrictCodes(districtCodes),
    ]);
  return assembleExport(
    groups,
    cityPolygons,
    districtPolygons,
    parentCityByDistrict,
    gradesByIzo
  );
};

/** One obec's worth of work: a standalone obec or a pooled big city. */
type ObecWorkItem =
  | {
      kind: "obec";
      obecKod: number;
      typeCode: SchoolTypeCode;
      municipality: Municipality;
    }
  | {
      kind: "city";
      obecKod: number;
      typeCode: SchoolTypeCode;
      municipalities: Municipality[];
    };

/**
 * Pure assembly step: given the groups and pre-fetched boundaries, assemble every
 * obec with shared allocators and dedupe. No DB access — unit-testable with
 * synthetic municipalities + boundaries.
 *
 * District-first cities are pooled: all městská-část municipalities sharing a
 * parent city (per `parentCityByDistrict`) are exported as one obec (P4-3);
 * everything else is a standalone obec. Obce are processed in a deterministic
 * order (by obec code, then type) so shared allocators are reproducible.
 */
export const assembleExport = (
  groups: ExportGroup[],
  cityPolygons: PolygonsByCodes,
  districtPolygons: PolygonsByCodes,
  parentCityByDistrict: Map<number, number>,
  gradesByIzo?: GradesByIzo
): MigrationExport => {
  const allocObvodKod = counter(OBVOD_KOD_START);
  const allocOkrsekKod = counter(OKRSEK_KOD_START);
  const allocId = counter(ID_START);
  const grades = gradesByIzo ?? (() => undefined);

  const cityBuckets = new Map<string, ObecWorkItem & { kind: "city" }>();
  const items: ObecWorkItem[] = [];

  for (const group of groups) {
    for (const municipality of group.municipalities) {
      if (municipality.areas.length === 0) continue;

      if (municipality.municipalityType === "district") {
        const cityCode = parentCityByDistrict.get(municipality.code);
        if (cityCode === undefined) {
          throw new Error(
            `No parent city for district ${municipality.code} (${municipality.municipalityName}).`
          );
        }
        const key = `${group.typeCode}:${cityCode}`;
        let bucket = cityBuckets.get(key);
        if (!bucket) {
          bucket = {
            kind: "city",
            obecKod: cityCode,
            typeCode: group.typeCode,
            municipalities: [],
          };
          cityBuckets.set(key, bucket);
          items.push(bucket);
        }
        bucket.municipalities.push(municipality);
      } else {
        items.push({
          kind: "obec",
          obecKod: municipality.code,
          typeCode: group.typeCode,
          municipality,
        });
      }
    }
  }

  // deterministic processing order regardless of input order
  items.sort(
    (a, b) => a.obecKod - b.obecKod || a.typeCode.localeCompare(b.typeCode)
  );

  const merged = emptyExport();
  for (const item of items) {
    const ctx: ObecBuildContext = {
      obecKod: item.obecKod,
      typeCode: item.typeCode,
      allocObvodKod,
      allocOkrsekKod,
      allocId,
      gradesByIzo: grades,
    };

    if (item.kind === "city") {
      const districts = [...item.municipalities].sort(
        (a, b) => a.code - b.code
      );
      appendTables(
        merged,
        buildBigCityTables(
          item.obecKod,
          item.typeCode,
          districts,
          cityPolygons,
          districtPolygons,
          ctx
        )
      );
    } else {
      const boundary = getMunicipalityBoundary(
        item.municipality,
        cityPolygons,
        districtPolygons
      );
      if (!boundary) {
        throw new Error(
          `No boundary polygon found for municipality ${item.municipality.municipalityName} (${item.obecKod}). Is the DB synced?`
        );
      }
      appendTables(merged, buildObecTables(item.municipality, boundary, ctx));
    }
  }

  // B5 — collapse duplicate join/attribute rows before serialization.
  return dedupeExport(merged);
};

/** One ordinance to export: its founder, the raw street-markdown, and the type. */
export interface OrdinanceInput {
  founderId: number;
  sourceText: string;
  schoolType: SchoolType;
}

/** A ŠO dropped from the export because it had no territory (MI04). */
export interface DroppedObvod {
  KOD: number;
  OBEC_KOD: number;
  TYP_OBVODU_KOD: SchoolTypeCode;
  izos: number[];
}

export interface ExportResult {
  data: MigrationExport;
  /** ordinances skipped because their founder couldn't be resolved */
  skipped: { founderId: number; reason: string }[];
  /** ŠO pruned for having no catchment (school with no addresses — MI04) */
  droppedEmptyObvody: DroppedObvod[];
  /** structural self-check findings (empty === clean) */
  integrityProblems: string[];
}

/**
 * Drop ŠO that ended up with no territory — no MIG_SKO_KO okrsek link and no
 * MIG_VYMEZENI_ZBYLYCH_KO whole-obec row. That happens when a school is listed
 * in the ordinance with no addresses: it yields a school circle but no okrsek.
 * Such a ŠO can't be migrated (CR0025 MI04, severity E), so it's excluded from
 * the export and returned in `dropped` for reporting. Its MIG_SKOLA_SKO rows go
 * with it; okrsky/def points/seams are untouched (an empty ŠO owns none).
 */
export const pruneEmptyObvody = (
  data: MigrationExport
): { data: MigrationExport; dropped: DroppedObvod[] } => {
  const linked = new Set(data.skoKo.map((l) => l.SKO_KOD));
  const wholeObec = new Set(
    data.vymezeni.map((v) => v.SKO_KOD).filter((k): k is number => k !== null)
  );
  const izosByObvod = new Map<number, number[]>();
  for (const s of data.skolaSko) {
    const arr = izosByObvod.get(s.SKO_KOD);
    if (arr) arr.push(s.SKOLA_IZO);
    else izosByObvod.set(s.SKO_KOD, [s.SKOLA_IZO]);
  }

  const dropKods = new Set<number>();
  const dropped: DroppedObvod[] = [];
  for (const o of data.obvody) {
    if (!linked.has(o.KOD) && !wholeObec.has(o.KOD)) {
      dropKods.add(o.KOD);
      dropped.push({
        KOD: o.KOD,
        OBEC_KOD: o.OBEC_KOD,
        TYP_OBVODU_KOD: o.TYP_OBVODU_KOD,
        izos: izosByObvod.get(o.KOD) ?? [],
      });
    }
  }
  if (dropKods.size === 0) return { data, dropped };

  return {
    data: {
      ...data,
      obvody: data.obvody.filter((o) => !dropKods.has(o.KOD)),
      skolaSko: data.skolaSko.filter((s) => !dropKods.has(s.SKO_KOD)),
    },
    dropped,
  };
};

/** Progress tick from {@link exportOrdinances} (see its `onProgress`). */
export interface ExportProgress {
  /** how many ordinance inputs have been resolved+parsed so far */
  done: number;
  /** total ordinance inputs */
  total: number;
  /** the founder just processed (0 in the `assemble` phase) */
  founderId: number;
  /**
   * `parse` = per-ordinance DB parse loop; `assemble` = geometry + self-check;
   * `retry` = a transient DB error is being retried (see `attempt`).
   */
  phase: "parse" | "assemble" | "retry";
  /** retry attempt number, set only when `phase === "retry"` */
  attempt?: number;
}

/**
 * P4-2 — the multi-founder / multi-type entrypoint. For each ordinance: resolve
 * the founder context (`getNewMunicipalityByFounderId`), seed it as the initial
 * parser state (DB `source_text` has no municipality header), parse to
 * municipalities, then assemble all of them into one export under shared
 * allocators + the supplied grade lookup, and self-check.
 *
 * The parse loop is the slow, DB-heavy part (address-point resolution per
 * ordinance); `onProgress` fires once per input so a long batch can show how far
 * it has got, then once with `phase: "assemble"` before the geometry pass.
 */
export const exportOrdinances = async (
  inputs: OrdinanceInput[],
  gradesByIzo?: GradesByIzo,
  onProgress?: (p: ExportProgress) => void
): Promise<ExportResult> => {
  const groups: ExportGroup[] = [];
  const skipped: { founderId: number; reason: string }[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    // Resolve + parse as one idempotent unit: a retry re-fetches a clean
    // municipality (getNewMunicipalityByFounderId) rather than reusing one the
    // failed attempt may have partly populated.
    const parsed = await withDbRetry(
      async (): Promise<{ skip: string } | { municipalities: Municipality[] }> => {
        const resolved = await getNewMunicipalityByFounderId(
          input.founderId,
          input.schoolType
        );
        if (resolved.errors.length > 0) {
          return { skip: resolved.errors.map((e) => e.message).join("; ") };
        }
        const municipalities = await parseOrdinanceToAddressPoints({
          lines: input.sourceText.split("\n"),
          schoolType: input.schoolType,
          initialState: { currentMunicipality: resolved.municipality },
          onError: () => {},
          onWarning: () => {},
          includeUnmappedAddressPoints: false,
        });
        return { municipalities };
      },
      (attempt) =>
        onProgress?.({
          done: i,
          total: inputs.length,
          founderId: input.founderId,
          phase: "retry",
          attempt,
        })
    );

    if ("skip" in parsed) {
      skipped.push({ founderId: input.founderId, reason: parsed.skip });
    } else {
      // A zš ordinance drives both 1.stupeň and (derived, same partition)
      // 2.stupeň (Part E); a mš ordinance is only type M.
      const baseType = schoolTypeToCode(input.schoolType);
      groups.push({ municipalities: parsed.municipalities, typeCode: baseType });
      if (baseType === "1") {
        groups.push({ municipalities: parsed.municipalities, typeCode: "2" });
      }
    }

    onProgress?.({
      done: i + 1,
      total: inputs.length,
      founderId: input.founderId,
      phase: "parse",
    });
  }

  onProgress?.({
    done: inputs.length,
    total: inputs.length,
    founderId: 0,
    phase: "assemble",
  });
  // The boundary fetch + assembly is idempotent (fresh allocators each call), so
  // a transient drop here retries the whole step cleanly.
  const raw = await withDbRetry(
    () => buildMigrationExportForGroups(groups, gradesByIzo),
    (attempt) =>
      onProgress?.({
        done: inputs.length,
        total: inputs.length,
        founderId: 0,
        phase: "retry",
        attempt,
      })
  );
  const { data, dropped } = pruneEmptyObvody(raw);
  return {
    data,
    skipped,
    droppedEmptyObvody: dropped,
    integrityProblems: checkIntegrity(data),
  };
};

/** Ordinance school type → MIG_* obvod type code (2.stupeň is derived, Phase 5). */
export const schoolTypeToCode = (type: SchoolType): SchoolTypeCode =>
  type === SchoolType.Kindergarten ? "M" : "1";

const emptyExport = (): MigrationExport => ({
  obvody: [],
  okrsky: [],
  skoKo: [],
  defBody: [],
  hrany: [],
  skolaSko: [],
  vymezeni: [],
});

const appendTables = (into: MigrationExport, from: ObecTables): void => {
  into.obvody.push(...from.obvody);
  into.okrsky.push(...from.okrsky);
  into.skoKo.push(...from.skoKo);
  into.defBody.push(...from.defBody);
  into.hrany.push(...from.hrany);
  into.skolaSko.push(...from.skolaSko);
  into.vymezeni.push(...from.vymezeni);
};
