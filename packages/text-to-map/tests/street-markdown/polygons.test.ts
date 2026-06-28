import { describe, expect, test } from "@jest/globals";
import { featureCollection, polygon } from "@turf/helpers";
import {
  buildLabeledCells,
  createPolygons,
  dissolveAreaSetComponents,
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
