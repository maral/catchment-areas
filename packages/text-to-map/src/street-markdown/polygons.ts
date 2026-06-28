import { Delaunay } from "d3-delaunay";
import { Area, ExportAddressPoint, Municipality } from "./types";

import {
  Feature,
  FeatureCollection,
  LineString,
  MultiPolygon,
  Point,
  Polygon,
  featureCollection,
  lineString,
  point as turfPoint,
  polygon,
} from "@turf/helpers";
import intersect from "@turf/intersect";
import distance from "@turf/distance";
import { booleanIntersects } from "@turf/boolean-intersects";
import Graph from "graphology";
import { color } from "graphology-color";
import { toMercator, toWgs84 } from "@turf/projection";
import union from "@turf/union";
import { getCityPolygons, getDistrictPolygons } from "../db/cities";
import truncate from "@turf/truncate";
import { PolygonsByCodes } from "../db/types";
import difference from "@turf/difference";

/**
 * Properties carried by a single labeled Voronoi cell. One cell per unique
 * address point; `areaIndexes` holds every area that address belongs to (more
 * than one only when an address is deliberately shared between schools).
 */
export interface LabeledCellProps {
  areaIndexes: number[];
  /** index of the generating point within the Delaunay/Voronoi triangulation */
  index: number;
  /** indexes of the adjacent Voronoi cells */
  neighbors: Set<number>;
  /** [lng, lat] of the address point that generated this cell */
  generator: number[];
  /** address string of the generating point */
  generatorAddress: string;
}

export const municipalitiesToPolygons = async (
  municipalities: Municipality[]
): Promise<Record<number, FeatureCollection>> => {
  const { cityCodes, districtCodes } = extractMunicipalityCodes(municipalities);
  const cityPolygons = await getCityPolygons(cityCodes);
  const districtPolygons = await getDistrictPolygons(districtCodes);

  if (
    Object.keys(cityPolygons).length === 0 &&
    Object.keys(districtPolygons).length === 0
  ) {
    console.log("No polygons found for given municipalities.");
    return {};
  }

  // municipalityCode -> areas
  const extraAreas = getExtraAreas(municipalities);

  const collectionMap = new Map<
    number,
    FeatureCollection<Polygon | MultiPolygon>
  >();
  // areaIndex -> polygon
  const extraPolygonsMap = new Map<number, Feature<Polygon | MultiPolygon>[]>();

  for (const municipality of municipalities) {
    if (municipality.areas.length === 0) {
      continue;
    }
    const { featureCollection, extraPolygons } = createPolygons(
      municipality,
      extraAreas.get(municipality.code) ?? [],
      getMunicipalityPolygons(municipality, cityPolygons, districtPolygons)
    );
    collectionMap.set(municipality.code, featureCollection);
    if (extraAreas.has(municipality.code)) {
      for (const [areaIndex, extraPolygon] of extraPolygons) {
        if (!extraPolygonsMap.has(areaIndex)) {
          extraPolygonsMap.set(areaIndex, []);
        }
        extraPolygonsMap.get(areaIndex).push(extraPolygon);
      }
    }
  }

  addExtraPolygons(collectionMap, extraPolygonsMap);

  findColoring(collectionMap);

  const result: Record<number, FeatureCollection> = {};
  for (const [municipalityCode, collection] of collectionMap) {
    result[municipalityCode] = collection;
  }
  return result;
};

const findColoring = (collectionMap: Map<number, FeatureCollection>) => {
  // put all the features in one array
  const allFeatures = Array.from(collectionMap.values()).reduce(
    (acc, collection) => {
      acc.push(...collection.features);
      return acc;
    },
    []
  );

  if (allFeatures.length <= 5) {
    allFeatures.forEach((feature, index) => {
      feature.properties.colorIndex = index;
    });
    return;
  }

  const graph = new Graph();
  allFeatures.forEach((feature) => {
    graph.addNode(feature.properties.areaIndex);
  });

  for (const feature1 of allFeatures) {
    for (const feature2 of allFeatures) {
      if (
        feature1.properties.areaIndex !== feature2.properties.areaIndex &&
        booleanIntersects(feature1, feature2)
      ) {
        graph.addEdge(
          feature1.properties.areaIndex,
          feature2.properties.areaIndex
        );
      }
    }
  }

  color(graph);

  allFeatures.forEach((feature) => {
    feature.properties.colorIndex = graph.getNodeAttribute(
      feature.properties.areaIndex,
      "color"
    );
  });
};

const getExtraAreas = (municipalities: Municipality[]): Map<number, Area[]> => {
  // municipalityCode -> areas
  const extraAreas = new Map<number, Area[]>();

  for (const municipality of municipalities) {
    for (const area of municipality.areas) {
      // municipalityCode -> points
      const extraPoints = new Map<number, ExportAddressPoint[]>();
      for (const point of area.addresses) {
        if (point.municipalityCode) {
          if (!extraPoints.has(point.municipalityCode)) {
            extraPoints.set(point.municipalityCode, []);
          }

          extraPoints.get(point.municipalityCode).push(point);
        }
      }

      for (const [municipalityCode, points] of extraPoints) {
        if (!extraAreas.has(municipalityCode)) {
          extraAreas.set(municipalityCode, []);
        }

        extraAreas.get(municipalityCode).push({
          ...area,
          addresses: points,
        });
      }
    }
  }
  return extraAreas;
};

const addExtraPolygons = (
  collectionMap: Map<number, FeatureCollection<Polygon | MultiPolygon>>,
  extraPolygonsMap: Map<number, Feature<Polygon | MultiPolygon>[]>
) => {
  for (const collection of collectionMap.values()) {
    for (let i = 0; i < collection.features.length; i++) {
      const feature = collection.features[i];
      if (extraPolygonsMap.has(feature.properties.areaIndex)) {
        const polygons = extraPolygonsMap.get(feature.properties.areaIndex);
        const newPolygon = union(featureCollection([...polygons, feature]));
        const newFeature = {
          ...newPolygon,
          properties: { ...feature.properties },
        };
        collection.features[i] = newFeature;
      }
    }
  }
};

const getMunicipalityPolygons = (
  municipality: Municipality,
  cityPolygons: PolygonsByCodes,
  districtPolygons: PolygonsByCodes
): PolygonsByCodes => {
  const polygons: PolygonsByCodes = {};

  for (const cityCode of municipality.cityCodes) {
    if (cityPolygons[cityCode]) {
      polygons[cityCode] = cityPolygons[cityCode];

      if (
        municipality.municipalityType === "city" &&
        Object.keys(districtPolygons).length > 0 &&
        municipality.municipalityName !== "Brno"
      ) {
        let cityPolygon = extractPolygonFromCollection(cityPolygons[cityCode]);
        // subtract all district polygons from city polygon
        for (const [districtCode, districtPolygon] of Object.entries(
          districtPolygons
        )) {
          if (municipality.districtCodes.includes(parseInt(districtCode))) {
            continue;
          }
          cityPolygon = difference(
            featureCollection([
              cityPolygon,
              extractPolygonFromCollection(districtPolygon),
            ])
          );
        }
        polygons[cityCode] = featureCollection([cityPolygon]);
      }
    }
  }

  for (const districtCode of municipality.districtCodes) {
    if (districtPolygons[districtCode]) {
      polygons[districtCode] = districtPolygons[districtCode];
    }
  }

  return polygons;
};

export const createPolygons = (
  municipality: Municipality,
  extraAreas: Area[],
  municipalityPolygons: Record<
    number,
    FeatureCollection<Polygon | MultiPolygon>
  >
): {
  featureCollection: FeatureCollection<Polygon | MultiPolygon>;
  extraPolygons: Map<number, Feature<Polygon | MultiPolygon>>;
} => {
  const municipalitiesMultipolygon = createMunicipalitiesMultipolygon(
    Object.values(municipalityPolygons)
  );
  const allAreas = [...municipality.areas, ...extraAreas];
  const extraAreasIndexes = new Set(extraAreas.map((area) => area.index));

  const polygons = buildLabeledCells(allAreas);

  const unitedPolygons: Feature<Polygon | MultiPolygon>[] = [];
  const extraPolygons = new Map<number, Feature<Polygon | MultiPolygon>>();
  let colorIndex = 0;

  for (const area of allAreas) {
    const schoolPolygons: Feature<Polygon | MultiPolygon>[] =
      polygons.features.filter((polygon) =>
        polygon.properties.areaIndexes.includes(area.index)
      );

    if (schoolPolygons.length === 0) {
      continue;
    }

    const schoolPolygon = intersect(
      schoolPolygons.length > 1
        ? union(featureCollection(schoolPolygons))
        : schoolPolygons[0],
      municipalitiesMultipolygon
    );

    const feature = {
      ...schoolPolygon,
      properties: {
        areaIndex: area.index,
        schoolIzos: area.schools.map((school) => school.izo),
        colorIndex,
      },
    };
    if (extraAreasIndexes.has(area.index)) {
      extraPolygons.set(area.index, feature);
    } else {
      unitedPolygons.push(feature);
    }
    colorIndex++;
  }

  return {
    featureCollection: truncate({
      type: "FeatureCollection",
      features: [...unitedPolygons],
    }),
    extraPolygons,
  };
};

/**
 * Build the labeled Voronoi cell layer from a set of areas: one cell per unique
 * address point, each tagged with the area(s) it belongs to, its neighbors and
 * its generating point. This is the shared intermediate the public renderer
 * dissolves into per-area polygons and the migration export dissolves into
 * okrsky — exposed so both consume the exact same tessellation.
 */
export const buildLabeledCells = (
  allAreas: Area[]
): FeatureCollection<Polygon, LabeledCellProps> => {
  const uniquePoints = new Map<string, Feature>();

  for (const area of allAreas) {
    for (const point of area.addresses) {
      if (!uniquePoints.has(point.address)) {
        addPoint(uniquePoints, point, area.index);
      } else {
        uniquePoints.get(point.address).properties.areaIndexes.push(area.index);
      }
    }
  }

  const points = {
    type: "FeatureCollection",
    features: Array.from(uniquePoints.values()),
  } as FeatureCollection<Point>;

  return d3DelaunayVoronoi(points);
};

/** One connected component of an area-set region, clipped to the boundary. */
export interface AreaSetComponent {
  /** sorted area indexes this region belongs to; length > 1 = a shared (overlap) okrsek */
  areaIndexes: number[];
  /** a single connected polygon (one okrsek candidate) */
  polygon: Feature<Polygon>;
  /** generating address points ([lng,lat]) that fall inside this component; empty = "empty fragment" */
  generators: number[][];
}

/**
 * Dissolve the labeled cells into non-overlapping area-set regions: group cells
 * by their *exact* areaIndexes set (so a shared `{A,B}` cell forms its own
 * group), union each group, clip to the municipality/district boundary, and
 * split into connected components. Each component is one okrsek candidate.
 *
 * This is the migration-export counterpart to the renderer's per-area union in
 * `createPolygons` — the renderer lets shared cells belong to several
 * overlapping polygons, whereas here a shared cell becomes its own atom that
 * later links to multiple obvody.
 */
export const dissolveAreaSetComponents = (
  cells: FeatureCollection<Polygon, LabeledCellProps>,
  boundary: Feature<Polygon | MultiPolygon>
): AreaSetComponent[] => {
  const groups = new Map<
    string,
    { areaIndexes: number[]; cells: Feature<Polygon, LabeledCellProps>[] }
  >();

  for (const cell of cells.features) {
    const areaIndexes = [...cell.properties.areaIndexes].sort((a, b) => a - b);
    const key = areaIndexes.join(",");
    const group = groups.get(key);
    if (group) {
      group.cells.push(cell);
    } else {
      groups.set(key, { areaIndexes, cells: [cell] });
    }
  }

  const components: AreaSetComponent[] = [];
  for (const { areaIndexes, cells: groupCells } of groups.values()) {
    const groupGenerators = groupCells.map((c) => c.properties.generator);
    const merged: Feature<Polygon | MultiPolygon> | null =
      groupCells.length > 1
        ? union(featureCollection(groupCells))
        : (groupCells[0] as Feature<Polygon | MultiPolygon>);
    if (merged === null) {
      continue;
    }
    const clipped = intersect(merged, boundary);
    if (clipped === null) {
      continue;
    }
    for (const component of splitPolygons(clipped)) {
      const generators = groupGenerators.filter((g) =>
        booleanIntersects(turfPoint(g), component)
      );
      components.push({ areaIndexes, polygon: component, generators });
    }
  }

  return components;
};

/** Flatten a Polygon/MultiPolygon feature into its connected Polygon components. */
const splitPolygons = (
  feature: Feature<Polygon | MultiPolygon>
): Feature<Polygon>[] => {
  if (feature.geometry.type === "Polygon") {
    return [feature as Feature<Polygon>];
  }
  return feature.geometry.coordinates.map((rings) => polygon(rings));
};

/**
 * Resolve "empty fragments" (OPEN-1 / §7): components with no generating address
 * inside — artifacts of clipping convex Voronoi cells to a non-convex boundary.
 * Each empty component is merged into the adjacent okrsek it shares the most
 * boundary with (preferring a real, non-empty neighbour), absorbing the
 * address-free land so coverage is preserved and no synthetic def points are
 * needed. Must run per district, before districts are combined.
 */
export const mergeEmptyFragments = (
  components: AreaSetComponent[]
): AreaSetComponent[] => {
  let working = [...components];

  for (;;) {
    const emptyIndex = working.findIndex((c) => c.generators.length === 0);
    if (emptyIndex === -1) {
      break;
    }
    const empty = working[emptyIndex];

    // candidate neighbours share a boundary of non-zero length with the fragment
    const neighbours = working
      .map((component, index) => ({ component, index }))
      .filter(({ index }) => index !== emptyIndex)
      .map((n) => ({
        ...n,
        shared: sharedBoundaryLength(empty.polygon, n.component.polygon),
      }))
      .filter((n) => n.shared > 0);

    if (neighbours.length === 0) {
      // isolated fragment (shouldn't happen for a tessellation) — drop it
      working.splice(emptyIndex, 1);
      continue;
    }

    // prefer real neighbours; among the pool the longest shared boundary wins,
    // tie-broken by a stable pre-code key (lowest area indexes, then min corner)
    const real = neighbours.filter((n) => n.component.generators.length > 0);
    const pool = real.length > 0 ? real : neighbours;
    const target = pool.sort(
      (a, b) =>
        b.shared - a.shared ||
        compareAreaIndexes(a.component.areaIndexes, b.component.areaIndexes) ||
        compareCorner(a.component.polygon, b.component.polygon)
    )[0];

    const mergedComponent: AreaSetComponent = {
      areaIndexes: target.component.areaIndexes,
      generators: target.component.generators,
      polygon: mergePolygons(target.component.polygon, empty.polygon),
    };

    working = working.filter(
      (_, index) => index !== emptyIndex && index !== target.index
    );
    working.push(mergedComponent);
  }

  return working;
};

/** Total length (m) of boundary segments shared by two polygons (cm-rounded match). */
const sharedBoundaryLength = (
  a: Feature<Polygon>,
  b: Feature<Polygon>
): number => {
  const segmentsA = boundarySegments(a);
  const segmentsB = boundarySegments(b);
  let total = 0;
  for (const [key, length] of segmentsA) {
    if (segmentsB.has(key)) {
      total += length;
    }
  }
  return total;
};

/** Map of undirected, cm-rounded boundary segment -> length in metres. */
const boundarySegments = (feature: Feature<Polygon>): Map<string, number> => {
  const segments = new Map<string, number>();
  for (const ring of feature.geometry.coordinates) {
    for (let i = 0; i + 1 < ring.length; i++) {
      const from = roundKey(ring[i]);
      const to = roundKey(ring[i + 1]);
      const key = from < to ? `${from}|${to}` : `${to}|${from}`;
      segments.set(key, distance(ring[i], ring[i + 1], { units: "meters" }));
    }
  }
  return segments;
};

const roundKey = (coord: number[]): string =>
  `${coord[0].toFixed(7)},${coord[1].toFixed(7)}`;

/** Union two edge-adjacent polygons; defensively keep the largest part. */
const mergePolygons = (
  a: Feature<Polygon>,
  b: Feature<Polygon>
): Feature<Polygon> => {
  const merged = union(featureCollection([a, b]));
  if (merged === null) {
    return a;
  }
  return splitPolygons(merged).reduce((largest, part) =>
    part.geometry.coordinates[0].length > largest.geometry.coordinates[0].length
      ? part
      : largest
  );
};

const compareAreaIndexes = (a: number[], b: number[]): number => {
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return a.length - b.length;
};

const compareCorner = (a: Feature<Polygon>, b: Feature<Polygon>): number => {
  const [ax, ay] = minCorner(a);
  const [bx, by] = minCorner(b);
  return ax - bx || ay - by;
};

const minCorner = (feature: Feature<Polygon>): [number, number] => {
  let min: [number, number] = [Infinity, Infinity];
  for (const ring of feature.geometry.coordinates) {
    for (const [x, y] of ring) {
      if (x < min[0] || (x === min[0] && y < min[1])) {
        min = [x, y];
      }
    }
  }
  return min;
};

/** An interior boundary shared by two okrsky (a MIG_HRAN_KO row). */
export interface Seam {
  /** ids (indexes into the input array) of the two okrsky the seam separates */
  ko1: number;
  ko2: number;
  line: Feature<LineString>;
}

const SNAP = 1e7; // ~cm grid in WGS-84 degrees (C-7 reprojects/rounds to EPSG:5514 cm)
const gridKey = (coord: number[]): string =>
  `${Math.round(coord[0] * SNAP)},${Math.round(coord[1] * SNAP)}`;
const snap = (coord: number[]): number[] => [
  Math.round(coord[0] * SNAP) / SNAP,
  Math.round(coord[1] * SNAP) / SNAP,
];

/**
 * Derive interior seams (§7) from a combined set of okrsky (one obec, all its
 * districts already pooled). Every okrsek-boundary segment is snapped to a cm
 * grid and keyed by its endpoints: a segment owned by exactly two okrsky is an
 * interior seam between them, one owned by a single okrsek is the outer obec
 * edge and is skipped (ČÚZK generates it). Shared segments are grouped by
 * okrsek pair and chained into polylines — district-line seams pair
 * automatically, since each such segment is owned by one okrsek from each side.
 *
 * `ko1`/`ko2` are array indexes; the caller maps them to minted KO_KOD in C-6.
 */
export const deriveSeams = (okrsky: Feature<Polygon>[]): Seam[] => {
  const segments = new Map<
    string,
    { owners: Set<number>; a: number[]; b: number[] }
  >();

  okrsky.forEach((okrsek, id) => {
    for (const ring of okrsek.geometry.coordinates) {
      for (let i = 0; i + 1 < ring.length; i++) {
        const a = snap(ring[i]);
        const b = snap(ring[i + 1]);
        const ka = gridKey(a);
        const kb = gridKey(b);
        if (ka === kb) {
          continue; // zero-length after snapping
        }
        const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
        const entry = segments.get(key);
        if (entry) {
          entry.owners.add(id);
        } else {
          segments.set(key, { owners: new Set([id]), a, b });
        }
      }
    }
  });

  // group shared segments (owned by exactly two okrsky) by ordered okrsek pair
  const pairs = new Map<
    string,
    { ko1: number; ko2: number; segments: number[][][] }
  >();
  for (const { owners, a, b } of segments.values()) {
    if (owners.size !== 2) {
      continue; // 1 = obec edge (skip); >2 cannot happen for a partition
    }
    const [ko1, ko2] = [...owners].sort((p, q) => p - q);
    const key = `${ko1},${ko2}`;
    const entry = pairs.get(key);
    if (entry) {
      entry.segments.push([a, b]);
    } else {
      pairs.set(key, { ko1, ko2, segments: [[a, b]] });
    }
  }

  const seams: Seam[] = [];
  for (const { ko1, ko2, segments: pairSegments } of pairs.values()) {
    for (const coords of chainSegments(pairSegments)) {
      seams.push({ ko1, ko2, line: lineString(coords) });
    }
  }
  return seams;
};

/** Stitch unordered, endpoint-sharing segments into maximal polylines. */
const chainSegments = (segments: number[][][]): number[][][] => {
  const incident = new Map<string, number[]>();
  segments.forEach(([a, b], i) => {
    for (const key of [gridKey(a), gridKey(b)]) {
      const list = incident.get(key);
      if (list) {
        list.push(i);
      } else {
        incident.set(key, [i]);
      }
    }
  });

  const used = new Array<boolean>(segments.length).fill(false);
  const otherEnd = (segIndex: number, fromKey: string): number[] => {
    const [a, b] = segments[segIndex];
    return gridKey(a) === fromKey ? b : a;
  };
  const extend = (endpoint: number[], push: (p: number[]) => void) => {
    let key = gridKey(endpoint);
    for (;;) {
      const next = (incident.get(key) ?? []).find((i) => !used[i]);
      if (next === undefined) {
        break;
      }
      used[next] = true;
      const point = otherEnd(next, key);
      push(point);
      key = gridKey(point);
    }
  };

  const lines: number[][][] = [];
  for (let start = 0; start < segments.length; start++) {
    if (used[start]) {
      continue;
    }
    used[start] = true;
    const [a, b] = segments[start];
    const line = [a, b];
    extend(b, (p) => line.push(p));
    extend(a, (p) => line.unshift(p));
    lines.push(line);
  }
  return lines;
};

/** A definition point for an okrsek (a MIG_DEF_BOD_KO row). */
export interface DefPoint {
  /** id (index into the okrsky array) of the okrsek this point defines */
  ko: number;
  point: Feature<Point>;
}

/**
 * Pick one interior definition point per okrsek (§7 / C-5): the okrsek's own
 * address point closest to the centroid of its addresses — always a real,
 * strictly-interior point. Empties were absorbed in C-3, so every okrsek has
 * at least one generator and no synthetic points are ever required.
 */
export const selectDefPoints = (okrsky: AreaSetComponent[]): DefPoint[] =>
  okrsky.map((okrsek, ko) => ({
    ko,
    point: turfPoint(pickCentralGenerator(okrsek.generators)),
  }));

const pickCentralGenerator = (generators: number[][]): number[] => {
  if (generators.length === 1) {
    return generators[0];
  }
  const mean = [
    generators.reduce((sum, g) => sum + g[0], 0) / generators.length,
    generators.reduce((sum, g) => sum + g[1], 0) / generators.length,
  ];
  let best = generators[0];
  let bestDistance = distance(mean, best, { units: "meters" });
  for (const generator of generators.slice(1)) {
    const d = distance(mean, generator, { units: "meters" });
    if (d < bestDistance) {
      best = generator;
      bestDistance = d;
    }
  }
  return best;
};

const addPoint = (
  uniquePoints: Map<string, Feature>,
  point: ExportAddressPoint,
  areaIndex: number
) => {
  if (point.lat === null || point.lng === null) {
    return;
  }
  uniquePoints.set(point.address, {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [point.lng, point.lat],
    },
    properties: {
      areaIndexes: [areaIndex],
      address: point.address,
    },
  });
};

const d3DelaunayVoronoi = (
  points: FeatureCollection<Point>
): FeatureCollection<Polygon, LabeledCellProps> => {
  const converted = points.features.map((p) => {
    return toMercator([p.geometry.coordinates[0], p.geometry.coordinates[1]]);
  });

  const bbox = [...toMercator([-180, -85]), ...toMercator([180, 85])] as [
    number,
    number,
    number,
    number
  ];

  const delaunay = new Delaunay(Float64Array.of(...converted.flat()));
  const voronoi = delaunay.voronoi(bbox);
  return {
    type: "FeatureCollection",
    features: Array.from(voronoi.cellPolygons()).map((polygon) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [polygon.map((p) => toWgs84(p))],
      },
      properties: {
        areaIndexes: points.features[polygon.index].properties.areaIndexes,
        index: polygon.index,
        neighbors: new Set(voronoi.neighbors(polygon.index)),
        generator: points.features[polygon.index].geometry.coordinates,
        generatorAddress: points.features[polygon.index].properties.address,
      },
    })),
  };
};

const createMunicipalitiesMultipolygon = (
  municipalityPolygons: FeatureCollection[]
): Feature<Polygon | MultiPolygon> => {
  const municipalityPolygonFeatures = municipalityPolygons.reduce(
    (acc, municipalityPolygon) => {
      acc.push(
        ...municipalityPolygon.features.filter(
          (f) =>
            f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"
        )
      );
      return acc;
    },
    []
  );

  return extractPolygonFromCollection(
    featureCollection(municipalityPolygonFeatures)
  );
};

const extractMunicipalityCodes = (municipalities: Municipality[]) => {
  return municipalities.reduce(
    (acc, municipality) => {
      municipality.cityCodes.forEach((cityCode) => acc.cityCodes.add(cityCode));
      municipality.districtCodes.forEach((districtCode) =>
        acc.districtCodes.add(districtCode)
      );
      return acc;
    },
    { cityCodes: new Set<number>(), districtCodes: new Set<number>() }
  );
};

const extractPolygonFromCollection = (
  collection: FeatureCollection<Polygon | MultiPolygon>
): Feature<Polygon | MultiPolygon> =>
  collection.features.length > 1 ? union(collection) : collection.features[0];
