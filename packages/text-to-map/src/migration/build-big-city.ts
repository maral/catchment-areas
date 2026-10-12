import { PolygonsByCodes } from "../db/types";
import {
  getExtraAreas,
  getMunicipalityBoundary,
  getMunicipalityOwnBoundary,
} from "../street-markdown/polygons";
import { booleanIntersects } from "@turf/boolean-intersects";
import { Feature, MultiPolygon, Polygon, point } from "@turf/helpers";
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
  ctx: ObecBuildContext,
  /** district code -> its city, for every district of the pooled city */
  parentCityByDistrict?: Map<number, number>
): ObecTables => {
  // 1. globalise area indexes across founders (extra pieces keep their home
  //    index, so cross-district okrsky resolve to the same obvod)
  let nextIndex = 0;
  const indexed = districtMunicipalities.map((m) => ({
    ...m,
    areas: m.areas.map((area) => ({ ...area, index: nextIndex++ })),
  }));

  // 2. redistribute cross-district points to the district they fall in (§8 D1).
  //    The parser stamps a foreign address only for street lines under another
  //    district's header; "část obce" / "zbytek části obce" lines add other
  //    districts' addresses unstamped (Bystrc's "zbytek části obce Kníničky"),
  //    which then fell outside the founder's boundary and were clipped away.
  //    Stamp them by where they actually lie first.
  const globalised = stampForeignAddresses(
    indexed,
    cityObecKod,
    cityPolygons,
    districtPolygons,
    parentCityByDistrict
  );
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

  // 4. a district only other founders' cross-district pieces land in, with no
  //    founder of its own for this type (Bystrc's ZŠ takes "zbytek části obce
  //    Kníničky"; Kníničky founds only an MŠ) still needs tessellating — its
  //    pieces used to be dropped, leaving the district without okrsky.
  const claimed = new Set(sharedInputs.claimants.flatMap((m) => m.districtCodes));
  const piecesOnly = [...extraAreas.keys()]
    .filter(
      (code) =>
        !claimed.has(code) &&
        !sharedInputs.shared.has(code) &&
        districtPolygons[code] &&
        parentCityByDistrict?.get(code) === cityObecKod
    )
    .sort((a, b) => a - b);
  const piecesOnlyInputs: DistrictInput[] = piecesOnly.map((code) => {
    const boundary = districtBoundary(code, cityPolygons, districtPolygons);
    return { areas: extraAreas.get(code)!, boundary, trueBoundary: boundary };
  });

  // 5. one Voronoi input per městská část: its own areas plus the pieces others
  //    contributed to it, clipped to its (possibly multi-)district boundary.
  //    A leftover whole-city founder's boundary is the city polygon minus the
  //    districts in `districtPolygons` it doesn't list itself — so hand it only
  //    the districts tessellated separately *for this type*. The run-wide map
  //    also holds districts another type's ordinance named (Plzeň's MŠ names
  //    Plzeň 7 and 8 whole, its ZŠ only their "část obce"), which cut holes in
  //    the ZŠ territory.
  const separatelyTessellated = (m: Municipality): number[] => [
    ...sharedInputs.claimants
      .filter((other) => other !== m)
      .flatMap((other) => other.districtCodes),
    ...sharedInputs.shared,
    ...piecesOnly,
  ];
  // a district founder whose only district was carved out has nothing left;
  // a whole-city founder lists no districts but still owns the city territory
  const ownInputs = sharedInputs.claimants.filter(
    (m) => m.municipalityType === "city" || m.districtCodes.length > 0
  );
  const districtInputs: DistrictInput[] = ownInputs.map((m) => {
    const polygons = pickPolygons(districtPolygons, [
      ...m.districtCodes,
      ...separatelyTessellated(m),
    ]);
    const boundary = getMunicipalityBoundary(m, cityPolygons, polygons);
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
      trueBoundary: getMunicipalityOwnBoundary(m, cityPolygons, polygons),
    };
  });

  // 6. obvody/ŠO come from the home areas (one per global index)
  const allAreas = globalised.flatMap((m) => m.areas);

  return buildPooledObecTables(
    cityObecKod,
    typeCode,
    allAreas,
    [...districtInputs, ...sharedInputs.inputs, ...piecesOnlyInputs],
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

  let claimants = municipalities;
  const inputs: DistrictInput[] = [];
  for (const code of shared) {
    const boundary = districtBoundary(code, cityPolygons, districtPolygons);
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

/** One městská část's own polygon, as a clip boundary. */
const districtBoundary = (
  code: number,
  cityPolygons: PolygonsByCodes,
  districtPolygons: PolygonsByCodes
) =>
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

const pickPolygons = (
  polygons: PolygonsByCodes,
  codes: number[]
): PolygonsByCodes =>
  Object.fromEntries(
    [...new Set(codes)]
      .filter((code) => polygons[code])
      .map((code) => [code, polygons[code]])
  );

/**
 * Stamp every unstamped address lying outside its founder's own territory (but
 * inside another district of this city) with that district's code, so
 * `getExtraAreas` routes it there as a cross-district piece.
 */
const stampForeignAddresses = (
  municipalities: Municipality[],
  cityObecKod: number,
  cityPolygons: PolygonsByCodes,
  districtPolygons: PolygonsByCodes,
  parentCityByDistrict?: Map<number, number>
): Municipality[] => {
  if (!parentCityByDistrict) return municipalities;
  const cityDistricts = Object.keys(districtPolygons)
    .map(Number)
    .filter((code) => parentCityByDistrict.get(code) === cityObecKod)
    .sort((a, b) => a - b)
    .map((code) => ({
      code,
      parts: polygonParts(districtBoundary(code, cityPolygons, districtPolygons)),
    }));
  if (cityDistricts.length === 0) return municipalities;

  return municipalities.map((m) => {
    const others = municipalities
      .filter((other) => other !== m)
      .flatMap((other) => other.districtCodes);
    const own = getMunicipalityBoundary(
      m,
      cityPolygons,
      pickPolygons(districtPolygons, [...m.districtCodes, ...others])
    );
    if (!own) return m;
    const ownParts = polygonParts(own);
    return {
      ...m,
      areas: m.areas.map((area) => ({
        ...area,
        addresses: area.addresses.map((a) => {
          if (a.municipalityCode !== undefined || a.lat === null || a.lng === null) {
            return a;
          }
          const p = [a.lng, a.lat];
          if (inParts(p, ownParts)) return a;
          const home = cityDistricts.find((d) => inParts(p, d.parts));
          return home ? { ...a, municipalityCode: home.code } : a;
        }),
      })),
    };
  });
};

interface PolygonPart {
  rings: number[][][];
  bbox: [number, number, number, number];
}

const polygonParts = (feature: Feature<Polygon | MultiPolygon>): PolygonPart[] =>
  (feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates
  ).map((rings) => {
    const xs = rings[0].map((c) => c[0]);
    const ys = rings[0].map((c) => c[1]);
    return {
      rings,
      bbox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
    };
  });

const inRing = (p: number[], ring: number[][]): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};

const inParts = (p: number[], parts: PolygonPart[]): boolean =>
  parts.some(
    ({ rings, bbox: [x0, y0, x1, y1] }) =>
      p[0] >= x0 &&
      p[0] <= x1 &&
      p[1] >= y0 &&
      p[1] <= y1 &&
      inRing(p, rings[0]) &&
      !rings.slice(1).some((hole) => inRing(p, hole))
  );
