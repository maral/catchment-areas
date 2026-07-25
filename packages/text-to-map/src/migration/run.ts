import { getCityPolygons, getDistrictPolygons } from "../db/cities";
import {
  getMunicipalityBoundary,
  getMunicipalityCodes,
} from "../street-markdown/polygons";
import { Municipality } from "../street-markdown/types";
import { buildObecTables, counter } from "./build-obec";
import { dedupeExport } from "./dedupe";
import {
  MigrationExport,
  ObecTables,
  SchoolGrades,
  SchoolTypeCode,
} from "./types";

/** Starting seeds for the deterministic, globally-unique code/id allocators. */
const OBVOD_KOD_START = 10001; // 5-digit space
const OKRSEK_KOD_START = 100001; // 6-digit space
const ID_START = 1;

export interface RunOptions {
  typeCode: SchoolTypeCode;
  /** grades a school teaches (ČÚZK CSV); undefined => full band for the type */
  gradesByIzo?: (izo: string) => SchoolGrades | undefined;
}

/**
 * Build the full {@link MigrationExport} for a set of parsed municipalities.
 *
 * Fetches each municipality's clip boundary from the open-data DB, runs the
 * per-obec assembly (`buildObecTables`) with allocators shared across the whole
 * run so KOD/ID are globally unique, and concatenates the rows.
 *
 * NOTE: the district-first cities (Praha/Ostrava/Plzeň/Liberec) still need the
 * per-district clip → empty-merge → combine flow (§7); that lands with the full
 * orchestration (Phase 4). For plain single-boundary obce this is complete.
 */
export const buildMigrationExport = async (
  municipalities: Municipality[],
  options: RunOptions
): Promise<MigrationExport> => {
  const { cityCodes, districtCodes } = getMunicipalityCodes(municipalities);
  const cityPolygons = await getCityPolygons(cityCodes);
  const districtPolygons = await getDistrictPolygons(districtCodes);

  const allocObvodKod = counter(OBVOD_KOD_START);
  const allocOkrsekKod = counter(OKRSEK_KOD_START);
  const allocId = counter(ID_START);

  const merged: MigrationExport = {
    obvody: [],
    okrsky: [],
    skoKo: [],
    defBody: [],
    hrany: [],
    skolaSko: [],
    vymezeni: [],
  };

  for (const municipality of municipalities) {
    if (municipality.areas.length === 0) continue;

    const boundary = getMunicipalityBoundary(
      municipality,
      cityPolygons,
      districtPolygons
    );
    if (!boundary) {
      throw new Error(
        `No boundary polygon found for municipality ${municipality.municipalityName} (${municipality.code}). Is the DB synced?`
      );
    }

    const tables = buildObecTables(municipality, boundary, {
      obecKod: municipality.code,
      typeCode: options.typeCode,
      allocObvodKod,
      allocOkrsekKod,
      allocId,
      gradesByIzo: options.gradesByIzo ?? (() => undefined),
    });

    appendTables(merged, tables);
  }

  // B5 — collapse duplicate join/attribute rows before serialization.
  return dedupeExport(merged);
};

const appendTables = (into: MigrationExport, from: ObecTables): void => {
  into.obvody.push(...from.obvody);
  into.okrsky.push(...from.okrsky);
  into.skoKo.push(...from.skoKo);
  into.defBody.push(...from.defBody);
  into.hrany.push(...from.hrany);
  into.skolaSko.push(...from.skolaSko);
  into.vymezeni.push(...from.vymezeni);
};
