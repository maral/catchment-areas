import { describe, expect, test } from "@jest/globals";
import { featureCollection, point as turfPoint, polygon } from "@turf/helpers";
import { booleanIntersects } from "@turf/boolean-intersects";
import {
  buildLabeledCells,
  createPolygons,
  deriveSeams,
  dissolveAreaSetComponents,
  mergeEmptyFragments,
  selectDefPoints,
} from "../../src/street-markdown/polygons";
import { Area, Municipality } from "../../src/street-markdown/types";

// Map a small planar grid into real lng/lat so Mercator behaves like production.
const B = (x: number, y: number): [number, number] => [
  14.4 + x * 0.01,
  50.0 + y * 0.01,
];
const addr = (address: string, x: number, y: number) => {
  const [lng, lat] = B(x, y);
  return { address, lng, lat };
};

const areas: Area[] = [
  {
    index: 0,
    schools: [{ name: "Left", izo: "izoL" }],
    addresses: [addr("L-1", 2, 2), addr("L-2", 2, 8)],
  },
  {
    index: 1,
    schools: [{ name: "Right", izo: "izoR" }],
    addresses: [addr("R-1", 8, 2), addr("R-2", 8, 8)],
  },
];

const municipality: Municipality = {
  municipalityName: "Test",
  code: 1,
  municipalityType: "city",
  cityCodes: [1],
  districtCodes: [],
  areas,
  unmappedPoints: [],
};

const boundary = polygon([[B(0, 0), B(10, 0), B(10, 10), B(0, 10), B(0, 0)]]);
const municipalityPolygons = { 1: featureCollection([boundary]) };

describe("createPolygons", () => {
  test("produces one clipped polygon per area (stable snapshot)", () => {
    const { featureCollection: fc } = createPolygons(
      municipality,
      [],
      municipalityPolygons
    );
    expect(fc.features.length).toBe(2);
    expect(fc.features.map((f) => f.properties.areaIndex).sort()).toEqual([
      0, 1,
    ]);
    expect(fc).toMatchSnapshot();
  });
});

describe("buildLabeledCells", () => {
  test("one labeled cell per unique address, tagged with its area + generator", () => {
    const cells = buildLabeledCells(areas);

    expect(cells.features).toHaveLength(4);
    for (const cell of cells.features) {
      expect(cell.properties.areaIndexes.length).toBeGreaterThanOrEqual(1);
      expect(cell.properties.generator).toHaveLength(2);
      expect(typeof cell.properties.generatorAddress).toBe("string");
      expect(cell.properties.neighbors).toBeInstanceOf(Set);
    }

    const byArea = (i: number) =>
      cells.features.filter((c) => c.properties.areaIndexes.includes(i));
    expect(byArea(0)).toHaveLength(2);
    expect(byArea(1)).toHaveLength(2);

    // the generator address round-trips onto its cell
    const lOne = cells.features.find(
      (c) => c.properties.generatorAddress === "L-1"
    );
    expect(lOne?.properties.areaIndexes).toEqual([0]);
  });

  test("a shared address yields a single cell tagged with both areas", () => {
    const shared = addr("shared", 5, 5);
    const cells = buildLabeledCells([
      { index: 0, schools: [{ name: "A", izo: "a" }], addresses: [shared] },
      { index: 1, schools: [{ name: "B", izo: "b" }], addresses: [shared] },
    ]);

    expect(cells.features).toHaveLength(1);
    expect(cells.features[0].properties.areaIndexes).toEqual([0, 1]);
  });
});

describe("dissolveAreaSetComponents", () => {
  test("one clipped component per area for a clean left/right split", () => {
    const components = dissolveAreaSetComponents(
      buildLabeledCells(areas),
      boundary
    );

    expect(components).toHaveLength(2);
    expect(components.map((c) => c.areaIndexes).sort()).toEqual([[0], [1]]);
    for (const c of components) {
      expect(c.polygon.geometry.type).toBe("Polygon");
    }
  });

  test("a shared address becomes its own {A,B} component (overlay atom)", () => {
    const shared = addr("shared", 5, 5);
    const components = dissolveAreaSetComponents(
      buildLabeledCells([
        {
          index: 0,
          schools: [{ name: "A", izo: "a" }],
          addresses: [addr("a", 2, 5), shared],
        },
        {
          index: 1,
          schools: [{ name: "B", izo: "b" }],
          addresses: [addr("b", 8, 5), shared],
        },
      ]),
      boundary
    );

    // three atoms: {0}, {1}, and the shared {0,1}
    const sets = components.map((c) => c.areaIndexes);
    expect(sets).toContainEqual([0, 1]);
    expect(sets).toContainEqual([0]);
    expect(sets).toContainEqual([1]);
  });
});

describe("mergeEmptyFragments", () => {
  // U-shaped obec: bottom bar + left/right arms; the top-centre notch is OUTSIDE.
  // School A sits in the left arm; school B fills the bottom. A's Voronoi cell
  // reaches across the notch into the right-arm top, which clips to a
  // generator-less fragment — the artifact reproduced in §4.
  const uBoundary = polygon([
    [
      B(0, 0),
      B(10, 0),
      B(10, 10),
      B(7, 10),
      B(7, 3),
      B(3, 3),
      B(3, 10),
      B(0, 10),
      B(0, 0),
    ],
  ]);
  const uCells = () =>
    buildLabeledCells([
      {
        index: 0,
        schools: [{ name: "A", izo: "a" }],
        addresses: [addr("A", 1.5, 8)],
      },
      {
        index: 1,
        schools: [{ name: "B", izo: "b" }],
        addresses: [addr("B1", 5, 1), addr("B2", 1.5, 1), addr("B3", 8.5, 1)],
      },
    ]);

  test("absorbs the concavity fragment into a neighbour (no coverage gap)", () => {
    const components = dissolveAreaSetComponents(uCells(), uBoundary);
    // sanity: the concavity really did produce an empty fragment
    expect(components.some((c) => c.generators.length === 0)).toBe(true);

    const merged = mergeEmptyFragments(components);

    // no empty okrsek remains
    expect(merged.every((c) => c.generators.length > 0)).toBe(true);
    // area 0 collapses to a single (left-arm) okrsek
    expect(merged.filter((c) => c.areaIndexes.includes(0))).toHaveLength(1);

    // the fragment's land is still covered by a real okrsek — absorbed, not dropped
    const fragmentInterior = turfPoint(B(8, 9));
    const covering = merged.find((c) =>
      booleanIntersects(fragmentInterior, c.polygon)
    );
    expect(covering).toBeDefined();
    expect(covering!.generators.length).toBeGreaterThan(0);
  });

  test("leaves a clean convex split untouched", () => {
    const components = dissolveAreaSetComponents(buildLabeledCells(areas), boundary);
    const merged = mergeEmptyFragments(components);
    expect(merged).toHaveLength(components.length);
    expect(merged.every((c) => c.generators.length > 0)).toBe(true);
  });
});

describe("deriveSeams", () => {
  test("one interior seam between adjacent okrsky; obec edges skipped", () => {
    const okrsky = dissolveAreaSetComponents(
      buildLabeledCells(areas),
      boundary
    ).map((c) => c.polygon);

    const seams = deriveSeams(okrsky);

    // exactly one shared seam (the x=5 bisector); all square-edge segments dropped
    expect(seams).toHaveLength(1);
    expect([seams[0].ko1, seams[0].ko2]).toEqual([0, 1]);
    expect(seams[0].line.geometry.type).toBe("LineString");
    expect(
      seams[0].line.geometry.coordinates.length
    ).toBeGreaterThanOrEqual(2);
  });

  test("no seam between non-adjacent okrsky", () => {
    // two separate squares that don't touch -> no shared boundary
    const left = polygon([[B(0, 0), B(2, 0), B(2, 2), B(0, 2), B(0, 0)]]);
    const right = polygon([[B(8, 0), B(10, 0), B(10, 2), B(8, 2), B(8, 0)]]);
    expect(deriveSeams([left, right])).toHaveLength(0);
  });
});

describe("selectDefPoints", () => {
  const okrsky = () =>
    mergeEmptyFragments(
      dissolveAreaSetComponents(buildLabeledCells(areas), boundary)
    );

  test("one strictly-interior def point per okrsek", () => {
    const list = okrsky();
    const defs = selectDefPoints(list);

    expect(defs).toHaveLength(list.length);
    for (const { ko, point } of defs) {
      expect(point.geometry.type).toBe("Point");
      expect(booleanIntersects(point, list[ko].polygon)).toBe(true);
    }
  });

  test("each def point is one of the okrsek's own addresses (never synthetic)", () => {
    const list = okrsky();
    for (const { ko, point } of selectDefPoints(list)) {
      const [lng, lat] = point.geometry.coordinates;
      const isGenerator = list[ko].generators.some(
        (g) => g[0] === lng && g[1] === lat
      );
      expect(isGenerator).toBe(true);
    }
  });
});
