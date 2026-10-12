import { Feature, MultiPolygon, Polygon } from "@turf/helpers";
import { MigrationExport, SchoolTypeCode } from "./types";

/**
 * Local approximation of CR0025 **MI10** (ČÚZK kontroly_v2 item 5). ISÚI
 * rebuilds each obec+type's okrsek network from our inner seams
 * (MIG_HRAN_KO), the def points (MIG_DEF_BOD_KO) and the RÚIAN obec boundary,
 * and rejects it when the lines don't close up. We check the failure shapes
 * ISÚI reported, against the obec boundary we tessellated with:
 *
 * - **dangling seam end** — a seam end that neither meets another seam nor
 *   lies on the obec boundary ("konec hranice okrsku nenavazuje na jinou
 *   hranici okrsku a je dále než 500 mm od hranice obce");
 * - **inconsistent junction** — an inner point where seams meet but some
 *   okrsek appears on only one of them, i.e. a seam is missing ("v bodě se
 *   stýká N hranic okrsku s M různými okrsky");
 * - **boundary part without a def point** — an obec exclave no okrsek covers
 *   ("plocha sítě okrsku nemá odpovídající definiční bod").
 *
 * A hole in the obec boundary (an enclave of a neighbouring obec) is not
 * ours to cover and is not checked.
 */
export const checkSeamTopology = (
  data: MigrationExport,
  boundaryByObec: Map<number, Feature<Polygon | MultiPolygon>>
): string[] => {
  const problems: string[] = [];
  const okrsekGroup = new Map<number, string>();
  const groups = new Map<
    string,
    { obecKod: number; typeCode: SchoolTypeCode; seams: Seam[]; defPoints: number[][] }
  >();
  for (const o of data.okrsky) {
    const key = `${o.OBEC_KOD}:${o.TYP_OBVODU_KOD}`;
    okrsekGroup.set(o.KOD, key);
    if (!groups.has(key)) {
      groups.set(key, {
        obecKod: o.OBEC_KOD,
        typeCode: o.TYP_OBVODU_KOD,
        seams: [],
        defPoints: [],
      });
    }
  }
  for (const h of data.hrany) {
    const group = groups.get(okrsekGroup.get(h.KO_KOD1) ?? "");
    group?.seams.push({ ko1: h.KO_KOD1, ko2: h.KO_KOD2, coords: h.geometry.coordinates });
  }
  for (const d of data.defBody) {
    groups.get(okrsekGroup.get(d.KO_KOD) ?? "")?.defPoints.push(d.geometry.coordinates);
  }

  for (const { obecKod, typeCode, seams, defPoints } of groups.values()) {
    const boundary = boundaryByObec.get(obecKod);
    if (!boundary) continue;
    const label = `MI10: obec ${obecKod} typ ${typeCode}`;
    const projection = localProjection(boundary);
    const boundaryIndex = new SegmentIndex(
      boundaryRings(boundary).map((ring) => ring.map(projection))
    );

    // every seam vertex, by cm key -> the okrsky of the seams passing through it
    const nodes = new Map<string, { kos: number[]; ends: number }>();
    for (const seam of seams) {
      const last = seam.coords.length - 1;
      const closed = key(seam.coords[0]) === key(seam.coords[last]);
      seam.coords.forEach((coord, i) => {
        const isEnd = !closed && (i === 0 || i === last);
        const node = nodes.get(key(coord)) ?? { kos: [], ends: 0 };
        if (isEnd) {
          node.kos.push(seam.ko1, seam.ko2);
          node.ends++;
        } else if (i > 0 && !(closed && i === last)) {
          // a seam passing straight through counts both sides twice
          node.kos.push(seam.ko1, seam.ko2, seam.ko1, seam.ko2);
        }
        nodes.set(key(coord), node);
      });
    }

    for (const [nodeKey, { kos, ends }] of nodes) {
      if (ends === 0) continue;
      const coord = nodeKey.split(",").map((v) => Number(v) / SNAP);
      if (boundaryIndex.distance(projection(coord)) <= TOLERANCE_M) continue;
      const counts = new Map<number, number>();
      for (const ko of kos) counts.set(ko, (counts.get(ko) ?? 0) + 1);
      const where = `(${coord[0].toFixed(7)}, ${coord[1].toFixed(7)})`;
      if (kos.length === 2) {
        problems.push(`${label}: seam ${kos[0]}|${kos[1]} ends at ${where} without meeting another seam or the obec boundary`);
      } else if ([...counts.values()].some((n) => n % 2 !== 0)) {
        problems.push(`${label}: seams meet at ${where} but okrsky ${[...counts].filter(([, n]) => n % 2 !== 0).map(([ko]) => ko).join(", ")} are missing a seam there`);
      }
    }

    boundaryParts(boundary).forEach((part, i) => {
      if (!defPoints.some((p) => inPolygon(p, part))) {
        problems.push(`${label}: boundary part ${i + 1} (from ${part[0][0].map((v) => v.toFixed(5)).join(", ")}) has no def point — no okrsek covers it`);
      }
    });
  }
  return problems;
};

interface Seam {
  ko1: number;
  ko2: number;
  coords: number[][];
}

/** ISÚI's tolerance for a seam end "on" the obec boundary. */
const TOLERANCE_M = 0.5;

const SNAP = 1e7;
const key = (coord: number[]): string =>
  `${Math.round(coord[0] * SNAP)},${Math.round(coord[1] * SNAP)}`;

/** Equirectangular metres around the boundary's first vertex — ample for 0.5 m. */
const localProjection = (boundary: Feature<Polygon | MultiPolygon>) => {
  const [, lat0] = boundaryRings(boundary)[0][0];
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110574;
  return (coord: number[]): number[] => [coord[0] * kx, coord[1] * ky];
};

const boundaryParts = (
  boundary: Feature<Polygon | MultiPolygon>
): number[][][][] =>
  boundary.geometry.type === "Polygon"
    ? [boundary.geometry.coordinates]
    : boundary.geometry.coordinates;

const boundaryRings = (boundary: Feature<Polygon | MultiPolygon>): number[][][] =>
  boundaryParts(boundary).flat();

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

const inPolygon = (p: number[], rings: number[][][]): boolean =>
  inRing(p, rings[0]) && !rings.slice(1).some((hole) => inRing(p, hole));

/** Grid-bucketed segments for point-to-boundary distance queries (metres). */
class SegmentIndex {
  private readonly cells = new Map<string, number[][][]>();

  constructor(rings: number[][][]) {
    for (const ring of rings) {
      for (let i = 0; i + 1 < ring.length; i++) {
        const [a, b] = [ring[i], ring[i + 1]];
        const [x0, x1] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
        const [y0, y1] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
        for (let cx = cell(x0); cx <= cell(x1); cx++) {
          for (let cy = cell(y0); cy <= cell(y1); cy++) {
            const k = `${cx},${cy}`;
            const list = this.cells.get(k);
            if (list) list.push([a, b]);
            else this.cells.set(k, [[a, b]]);
          }
        }
      }
    }
  }

  /** Distance to the nearest segment, or Infinity beyond one cell away. */
  distance(p: number[]): number {
    let best = Infinity;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const [a, b] of this.cells.get(`${cell(p[0]) + dx},${cell(p[1]) + dy}`) ?? []) {
          best = Math.min(best, pointSegmentDistance(p, a, b));
        }
      }
    }
    return best;
  }
}

const CELL_M = 50;
const cell = (v: number): number => Math.floor(v / CELL_M);

const pointSegmentDistance = (p: number[], a: number[], b: number[]): number => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const len2 = dx * dx + dy * dy;
  const t =
    len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
};

/** Planar area (m²) of a polygon / multipolygon, holes subtracted. */
export const areaM2 = (feature: Feature<Polygon | MultiPolygon>): number => {
  const projection = localProjection(feature);
  const ringArea = (ring: number[][]): number => {
    const pts = ring.map(projection);
    let sum = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      sum += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1];
    }
    return Math.abs(sum) / 2;
  };
  return boundaryParts(feature).reduce(
    (total, [outer, ...holes]) =>
      total + ringArea(outer) - holes.reduce((h, ring) => h + ringArea(ring), 0),
    0
  );
};

/** Okrsky must cover the whole obec, without overlaps ("nesmí tam být díry"). */
const COVERAGE_TOLERANCE = 0.005;

/**
 * Coverage check per tessellated obec+type: the okrsky's total area against the
 * RÚIAN obec polygon. Short = a part of the obec no okrsek covers (a whole
 * district dropped — Brno-Kníničky, Liberec); over = overlapping okrsky. Seam
 * checks can't see either when no seam ends at the gap.
 */
export const checkCoverage = (
  obecKod: number,
  typeCode: SchoolTypeCode,
  okrskyAreaM2: number,
  boundary: Feature<Polygon | MultiPolygon>
): string | undefined => {
  const obecM2 = areaM2(boundary);
  const ratio = okrskyAreaM2 / obecM2;
  if (Math.abs(ratio - 1) <= COVERAGE_TOLERANCE) return undefined;
  return `coverage: obec ${obecKod} typ ${typeCode}: okrsky cover ${(ratio * 100).toFixed(1)} % of the obec area (${((okrskyAreaM2 - obecM2) / 1e6).toFixed(2)} km²)`;
};
