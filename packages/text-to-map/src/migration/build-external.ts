import { booleanIntersects } from "@turf/boolean-intersects";
import difference from "@turf/difference";
import {
  Feature,
  FeatureCollection,
  featureCollection,
  MultiPolygon,
  point,
  Polygon,
  polygon,
} from "@turf/helpers";
import intersect from "@turf/intersect";
import {
  AreaSetComponent,
  interiorPoint,
  mergeEmptyFragments,
} from "../street-markdown/polygons";
import { Municipality } from "../street-markdown/types";
import { buildPooledObecTables, ObecBuildContext } from "./build-obec";
import { areaM2 } from "./topology-check";
import { ObecTables } from "./types";

/**
 * An address-free part smaller than this is a sliver — left where the city's
 * outline crosses the obec boundary, or a remnant in its data — and merges
 * into the neighbour it shares the most border with.
 */
const SLIVER_M2 = 1000;

/**
 * Assemble one obec + type from catchment areas a city sent us as finished
 * geodata (Ostrava): its polygons *are* the okrsky — no Voronoi. The polygons
 * (properties `areaIndex`, as in our map data) are clipped to the obec boundary
 * and overlaid: land in one polygon only is that area's, land where several
 * overlap is their shared okrsek, linked to each of their ŠO (as a shared
 * {A,B} cell of a tessellation). Every connected part is one okrsek.
 * Numbering, def points, seams and the ŠO/škola rows are the common ones.
 *
 * Def points come from our address points the conversion attached to the area
 * (the most central one inside the part), or an interior point for a part with
 * none. Address-free slivers (under {@link SLIVER_M2}) merge into a neighbour
 * like the tessellation's empty fragments; zero-area parts are dropped.
 */
export const buildExternalObecTables = (
  municipality: Municipality,
  polygons: FeatureCollection<Polygon | MultiPolygon>,
  obecBoundary: Feature<Polygon | MultiPolygon>,
  ctx: ObecBuildContext
): ObecTables => {
  const areasByIndex = new Map(
    municipality.areas.map((area) => [area.index, area])
  );

  // overlay: pieces of land, each with the areas whose polygons cover it
  let pieces: { areaIndexes: number[]; geometry: Feature<Polygon | MultiPolygon> }[] =
    [];
  for (const feature of polygons.features) {
    const areaIndex = feature.properties?.areaIndex;
    if (!areasByIndex.has(areaIndex)) {
      ctx.problems?.push(
        `obec ${ctx.obecKod} type ${ctx.typeCode}: polygon of area ${areaIndex} has no such area in the map data`
      );
      continue;
    }
    const clipped = intersect(feature, obecBoundary);
    if (clipped === null) {
      ctx.problems?.push(
        `obec ${ctx.obecKod} type ${ctx.typeCode}: polygon of area ${areaIndex} lies outside the obec`
      );
      continue;
    }
    let rest: Feature<Polygon | MultiPolygon> | null = clipped;
    pieces = pieces.flatMap((piece) => {
      const shared = intersect(piece.geometry, clipped);
      if (shared === null) return [piece];
      rest = rest && difference(featureCollection([rest, piece.geometry]));
      const own = difference(featureCollection([piece.geometry, clipped]));
      return [
        ...(own ? [{ ...piece, geometry: own }] : []),
        {
          areaIndexes: [...new Set([...piece.areaIndexes, areaIndex])].sort(
            (a, b) => a - b
          ),
          geometry: shared,
        },
      ];
    });
    if (rest) pieces.push({ areaIndexes: [areaIndex], geometry: rest });
  }

  const okrsky: AreaSetComponent[] = [];
  for (const { areaIndexes, geometry } of pieces) {
    const parts =
      geometry.geometry.type === "Polygon"
        ? [geometry as Feature<Polygon>]
        : geometry.geometry.coordinates.map((rings) => polygon(rings));
    const addresses = areaIndexes.flatMap(
      (index) => areasByIndex.get(index)!.addresses
    );
    for (const part of parts) {
      const area = areaM2(part);
      if (area < 0.01) continue;
      const inside = addresses
        .map(({ lng, lat }) => [lng, lat])
        .filter((coord) => booleanIntersects(point(coord), part));
      okrsky.push({
        areaIndexes,
        polygon: part,
        generators:
          inside.length > 0
            ? inside
            : area < SLIVER_M2
              ? []
              : [interiorPoint(part)],
      });
    }
  }

  return buildPooledObecTables(
    ctx.obecKod,
    ctx.typeCode,
    municipality.areas,
    { okrsky: mergeEmptyFragments(okrsky) },
    ctx
  );
};
