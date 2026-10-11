import { describe, expect, test } from "@jest/globals";
import { featureCollection, point as turfPoint, polygon } from "@turf/helpers";
import { booleanIntersects } from "@turf/boolean-intersects";
import {
  assignOkrsekNumbers,
  buildLabeledCells,
  createPolygons,
  deriveSeams,
  dissolveAreaSetComponents,
  interiorPoint,
  mergeEmptyFragments,
  okrsekTerritory,
  selectDefPoints,
  selectExclaveDefPoints,
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

describe("dissolveAreaSetComponents — trueBoundary re-clip (§8 absorbed village)", () => {
  // "Right" school also absorbed a whole neighbouring village — its address
  // gets folded into the same area (mirrors processWholeMunicipalityLine),
  // which is why the *wide* clip boundary used to shape the tessellation
  // reaches out to include it, while trueBoundary stays the obec's own
  // polygon. Mirrors the real Benešov case (obec 529303) from ČÚZK's
  // kontroly_v1 item 17: 325 def points landing outside their declared obec.
  const villageAddr = addr("V-1", 15, 5);
  const areasWithAbsorption: Area[] = [
    areas[0],
    { ...areas[1], addresses: [...areas[1].addresses, villageAddr] },
  ];
  const wideBoundary = polygon([
    [B(0, 0), B(20, 0), B(20, 10), B(0, 10), B(0, 0)],
  ]);
  // a strict gap past x=10 so a component whose edge lands exactly on the
  // true boundary doesn't count as "intersecting" the village region
  const villageOnlyRegion = polygon([
    [B(10.5, 0), B(20, 0), B(20, 10), B(10.5, 10), B(10.5, 0)],
  ]);

  test("without trueBoundary, the wide tessellation extends into the absorbed village", () => {
    const components = dissolveAreaSetComponents(
      buildLabeledCells(areasWithAbsorption),
      wideBoundary
    );
    const rightComponent = components.find((c) => c.areaIndexes.includes(1))!;
    expect(booleanIntersects(rightComponent.polygon, villageOnlyRegion)).toBe(
      true
    );
  });

  test("with trueBoundary, the geometry is re-clipped back to the obec's own polygon", () => {
    const components = dissolveAreaSetComponents(
      buildLabeledCells(areasWithAbsorption),
      wideBoundary,
      boundary // the narrow, original obec polygon
    );

    expect(components.length).toBeGreaterThan(0);
    for (const c of components) {
      expect(booleanIntersects(c.polygon, villageOnlyRegion)).toBe(false);
    }
    // the absorbed village's own address is no longer a generator of any
    // component — a def point can never be picked from it
    const [vLng, vLat] = B(15, 5);
    const allGenerators = components.flatMap((c) => c.generators);
    expect(
      allGenerators.some((g) => g[0] === vLng && g[1] === vLat)
    ).toBe(false);
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

  test("attaches an address-free exclave to the nearest okrsek instead of dropping it", () => {
    // obec = main square + a detached square to its right; only the main part
    // has addresses, so the exclave is an isolated empty fragment
    const exclaveBoundary = {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "MultiPolygon" as const,
        coordinates: [
          [[B(0, 0), B(10, 0), B(10, 10), B(0, 10), B(0, 0)]],
          [[B(12, 0), B(14, 0), B(14, 2), B(12, 2), B(12, 0)]],
        ],
      },
    };
    const components = dissolveAreaSetComponents(
      buildLabeledCells(areas),
      exclaveBoundary
    );
    const merged = mergeEmptyFragments(components);

    expect(merged.every((c) => c.generators.length > 0)).toBe(true);
    const carriers = merged.filter((c) => (c.exclaves ?? []).length > 0);
    expect(carriers).toHaveLength(1);
    // the right-hand okrsek (area 1) is the nearer one
    expect(carriers[0].areaIndexes).toEqual([1]);

    const extra = selectExclaveDefPoints(merged);
    expect(extra).toHaveLength(1);
    expect(booleanIntersects(extra[0].point, carriers[0].exclaves![0])).toBe(true);
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

  test("pairs a district line where only one side has the seam's vertex (T-junction)", () => {
    // district 1 (x 0..5) is split into A (bottom) / B (top) at y=5; district 2
    // (x 5..10) is one okrsek C whose x=5 edge runs unbroken past (5,5)
    const a = polygon([[B(0, 0), B(5, 0), B(5, 5), B(0, 5), B(0, 0)]]);
    const b = polygon([[B(0, 5), B(5, 5), B(5, 10), B(0, 10), B(0, 5)]]);
    const c = polygon([[B(5, 0), B(10, 0), B(10, 10), B(5, 10), B(5, 0)]]);

    const pairs = deriveSeams([a, b, c])
      .map((s) => `${s.ko1}|${s.ko2}`)
      .sort();

    expect(pairs).toEqual(["0|1", "0|2", "1|2"]);
  });

  test("an exclave's edges against a neighbour become seams of the carrying okrsek", () => {
    const main = polygon([[B(0, 0), B(4, 0), B(4, 4), B(0, 4), B(0, 0)]]);
    const other = polygon([[B(6, 0), B(10, 0), B(10, 4), B(6, 4), B(6, 0)]]);
    const exclave = polygon([[B(10, 0), B(12, 0), B(12, 4), B(10, 4), B(10, 0)]]);
    const carrier = okrsekTerritory({
      areaIndexes: [0],
      polygon: main,
      generators: [B(2, 2)],
      exclaves: [exclave],
    });

    const seams = deriveSeams([carrier, other]);

    expect(seams).toHaveLength(1);
    expect([seams[0].ko1, seams[0].ko2]).toEqual([0, 1]);
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

describe("assignOkrsekNumbers", () => {
  const okrsky = () =>
    mergeEmptyFragments(
      dissolveAreaSetComponents(buildLabeledCells(areas), boundary)
    );

  // map each okrsek's def point -> its CISLO (identity independent of array order)
  const cisloByDefPoint = (list: ReturnType<typeof okrsky>) => {
    const defs = selectDefPoints(list);
    const map = new Map<string, number>();
    for (const { ko, cislo } of assignOkrsekNumbers(list)) {
      const [x, y] = defs[ko].point.geometry.coordinates;
      map.set(`${x},${y}`, cislo);
    }
    return map;
  };

  test("numbers okrsky 1..N uniquely", () => {
    const list = okrsky();
    const cisla = assignOkrsekNumbers(list)
      .map((o) => o.cislo)
      .sort((a, b) => a - b);
    expect(cisla).toEqual(list.map((_, i) => i + 1));
  });

  test("CISLO is stable regardless of input order", () => {
    const forward = cisloByDefPoint(okrsky());
    const reversed = cisloByDefPoint([...okrsky()].reverse());
    expect([...forward.entries()].sort()).toEqual(
      [...reversed.entries()].sort()
    );
  });
});

describe("interiorPoint", () => {
  test("lands inside a concave polygon, not in its notch", () => {
    const u = polygon([
      [B(0, 0), B(10, 0), B(10, 10), B(7, 10), B(7, 3), B(3, 3), B(3, 10), B(0, 10), B(0, 0)],
    ]);
    expect(booleanIntersects(turfPoint(interiorPoint(u)), u)).toBe(true);
    const [x] = interiorPoint(u);
    expect(x < B(3, 0)[0] || x > B(7, 0)[0]).toBe(true);
  });
});
