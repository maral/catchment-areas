import { PolygonsByCodes } from "../db/types";
import {
  getExtraAreas,
  getMunicipalityBoundary,
  getMunicipalityOwnBoundary,
} from "../street-markdown/polygons";
import { Municipality } from "../street-markdown/types";
import {
  buildPooledObecTables,
  DistrictInput,
  ObecBuildContext,
} from "./build-obec";
import { ObecTables, SchoolTypeCode } from "./types";

/**
 * P4-3 — assemble one obec for a district-first big city (Praha/Ostrava/Plzeň/
 * Liberec) by pooling all its městská-část founders under Q3.
 *
 * Each městská část is tessellated **within its own district boundary** and the
 * results are combined into one obec (`OBEC_KOD` = the city code). Cross-district
 * catchment points (stamped with another district's code) are redistributed with
 * `getExtraAreas` so each district's Voronoi covers the pieces physically in it
 * (§8 D1) — the renderer's `addExtraPolygons` union is never used.
 *
 * Area indexes are globalised first, so a school's home area and the pieces it
 * contributes to other districts share one index → one ŠO, with an okrsek in
 * each district linked to it. Combining the per-district okrsky lets the shared
 * seam/def/numbering derive the district-line seams automatically.
 */
export const buildBigCityTables = (
  cityObecKod: number,
  typeCode: SchoolTypeCode,
  districtMunicipalities: Municipality[],
  cityPolygons: PolygonsByCodes,
  districtPolygons: PolygonsByCodes,
  ctx: ObecBuildContext
): ObecTables => {
  // 1. globalise area indexes across founders (extra pieces keep their home
  //    index, so cross-district okrsky resolve to the same obvod)
  let nextIndex = 0;
  const globalised = districtMunicipalities.map((m) => ({
    ...m,
    areas: m.areas.map((area) => ({ ...area, index: nextIndex++ })),
  }));

  // 2. redistribute cross-district points to the district they fall in (§8 D1)
  const extraAreas = getExtraAreas(globalised);

  // 3. one Voronoi input per městská část: its own areas plus the pieces others
  //    contributed to it, clipped to its (possibly multi-)district boundary
  const districtInputs: DistrictInput[] = globalised.map((m) => {
    const boundary = getMunicipalityBoundary(m, cityPolygons, districtPolygons);
    if (!boundary) {
      throw new Error(
        `No district boundary for ${m.municipalityName} (${m.code}) of city ${cityObecKod}. Is the DB synced?`
      );
    }
    return {
      areas: [...m.areas, ...(extraAreas.get(m.code) ?? [])],
      boundary,
      // re-clip to this district's own polygon after `boundary` (wider, if it
      // absorbed a whole village via §8) has shaped the tessellation — see
      // getMunicipalityOwnBoundary.
      trueBoundary: getMunicipalityOwnBoundary(m, cityPolygons, districtPolygons),
    };
  });

  // 4. obvody/ŠO come from the home areas (one per global index)
  const allAreas = globalised.flatMap((m) => m.areas);

  return buildPooledObecTables(
    cityObecKod,
    typeCode,
    allAreas,
    districtInputs,
    ctx
  );
};
