import { PolygonsByCodes } from "../db/types";
import {
  getExtraAreas,
  getMunicipalityBoundary,
  getMunicipalityOwnBoundary,
} from "../street-markdown/polygons";
import { booleanIntersects } from "@turf/boolean-intersects";
import { point } from "@turf/helpers";
import {
  Area,
  ExportAddressPoint,
  Municipality,
} from "../street-markdown/types";
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

  // 3. a městská část claimed whole by several founders ("území městské části
  //    Praha-Nedvězí" in both Kolovraty's and Praha 22's ordinance) is a shared
  //    catchment. Left inside each claimant's boundary it was tessellated once
  //    per claimant — overlapping okrsky, and seams dangling where the overlaps
  //    met the district line (ČÚZK kontroly_v2 item 5). Carve it out of every
  //    claimant and tessellate it once, from all claimants' addresses in it, so
  //    shared addresses become one shared {A,B} okrsek.
  const sharedInputs = carveOutSharedDistricts(
    globalised,
    extraAreas,
    cityPolygons,
    districtPolygons
  );

  // 4. one Voronoi input per městská část: its own areas plus the pieces others
  //    contributed to it, clipped to its (possibly multi-)district boundary
  const ownInputs = sharedInputs.claimants.filter(
    (m) => m.districtCodes.length > 0
  );
  const districtInputs: DistrictInput[] = ownInputs.map((m) => {
    const boundary = getMunicipalityBoundary(m, cityPolygons, districtPolygons);
    if (!boundary) {
      throw new Error(
        `No district boundary for ${m.municipalityName} (${m.code}) of city ${cityObecKod}. Is the DB synced?`
      );
    }
    return {
      areas: [
        ...m.areas,
        // a carved-out district's pieces went to its shared input
        ...(sharedInputs.shared.has(m.code) ? [] : extraAreas.get(m.code) ?? []),
      ],
      boundary,
      // re-clip to this district's own polygon after `boundary` (wider, if it
      // absorbed a whole village via §8) has shaped the tessellation — see
      // getMunicipalityOwnBoundary.
      trueBoundary: getMunicipalityOwnBoundary(m, cityPolygons, districtPolygons),
    };
  });

  // 5. obvody/ŠO come from the home areas (one per global index)
  const allAreas = globalised.flatMap((m) => m.areas);

  return buildPooledObecTables(
    cityObecKod,
    typeCode,
    allAreas,
    [...districtInputs, ...sharedInputs.inputs],
    ctx
  );
};

/**
 * Split every district claimed by more than one founder (its code in several
 * founders' `districtCodes`) out into its own Voronoi input. Returns the
 * founders with those districts — and their addresses inside them — removed,
 * plus one input per shared district holding every claimant's addresses there
 * (and any cross-district pieces addressed to it).
 */
const carveOutSharedDistricts = (
  municipalities: Municipality[],
  extraAreas: Map<number, Area[]>,
  cityPolygons: PolygonsByCodes,
  districtPolygons: PolygonsByCodes
): {
  claimants: Municipality[];
  inputs: DistrictInput[];
  shared: Set<number>;
} => {
  const claimCount = new Map<number, number>();
  for (const m of municipalities) {
    for (const code of new Set(m.districtCodes)) {
      claimCount.set(code, (claimCount.get(code) ?? 0) + 1);
    }
  }
  const shared = [...claimCount]
    .filter(([code, n]) => n > 1 && districtPolygons[code])
    .map(([code]) => code)
    .sort((a, b) => a - b);
  if (shared.length === 0) {
    return { claimants: municipalities, inputs: [], shared: new Set() };
  }

  const boundaryOf = (code: number) =>
    getMunicipalityBoundary(
      {
        municipalityName: String(code),
        code,
        municipalityType: "district",
        cityCodes: [],
        districtCodes: [code],
        areas: [],
        unmappedPoints: [],
      },
      cityPolygons,
      districtPolygons
    );

  let claimants = municipalities;
  const inputs: DistrictInput[] = [];
  for (const code of shared) {
    const boundary = boundaryOf(code);
    const inside = (a: ExportAddressPoint) =>
      a.lat !== null &&
      a.lng !== null &&
      booleanIntersects(point([a.lng, a.lat]), boundary);
    const sharedAreas: Area[] = [...(extraAreas.get(code) ?? [])];
    claimants = claimants.map((m) => {
      if (!m.districtCodes.includes(code)) return m;
      return {
        ...m,
        districtCodes: m.districtCodes.filter((c) => c !== code),
        areas: m.areas.map((area) => {
          const here = new Set(
            area.addresses.filter(
              (a) => a.municipalityCode === undefined && inside(a)
            )
          );
          if (here.size === 0) return area;
          sharedAreas.push({ ...area, addresses: [...here] });
          return {
            ...area,
            addresses: area.addresses.filter((a) => !here.has(a)),
          };
        }),
      };
    });
    inputs.push({ areas: sharedAreas, boundary, trueBoundary: boundary });
  }
  return { claimants, inputs, shared: new Set(shared) };
};
