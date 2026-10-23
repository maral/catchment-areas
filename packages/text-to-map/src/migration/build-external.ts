import { booleanIntersects } from "@turf/boolean-intersects";
import {
  Feature,
  FeatureCollection,
  MultiPolygon,
  point,
  Polygon,
  polygon,
} from "@turf/helpers";
import intersect from "@turf/intersect";
import {
  AreaSetComponent,
  interiorPoint,
} from "../street-markdown/polygons";
import { Municipality } from "../street-markdown/types";
import { buildPooledObecTables, ObecBuildContext } from "./build-obec";
import { ObecTables } from "./types";

/**
 * Assemble one obec + type from catchment areas a city sent us as finished
 * geodata (Ostrava): its polygons *are* the okrsky — no Voronoi. Each polygon
 * (properties `areaIndex`, as in our map data) is clipped to the obec boundary
 * and split into its connected parts, one okrsek each, linked to its area's ŠO.
 * Numbering, def points, seams and the ŠO/škola rows are the common ones.
 *
 * Def points come from our address points the conversion attached to the area
 * (the most central one inside the part), or an interior point for a part with
 * none.
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

  const okrsky: AreaSetComponent[] = [];
  for (const feature of polygons.features) {
    const areaIndex = feature.properties?.areaIndex;
    const area = areasByIndex.get(areaIndex);
    if (!area) {
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
    const parts =
      clipped.geometry.type === "Polygon"
        ? [clipped as Feature<Polygon>]
        : clipped.geometry.coordinates.map((rings) => polygon(rings));
    for (const part of parts) {
      const inside = area.addresses
        .map(({ lng, lat }) => [lng, lat])
        .filter((coord) => booleanIntersects(point(coord), part));
      okrsky.push({
        areaIndexes: [areaIndex],
        polygon: part,
        generators: inside.length > 0 ? inside : [interiorPoint(part)],
      });
    }
  }

  return buildPooledObecTables(
    ctx.obecKod,
    ctx.typeCode,
    municipality.areas,
    { okrsky },
    ctx
  );
};
