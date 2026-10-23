import { describe, expect, test } from "@jest/globals";
import {
  Feature,
  featureCollection,
  MultiPolygon,
  multiPolygon,
  Polygon,
  polygon,
} from "@turf/helpers";
import { buildExternalObecTables } from "../../src/migration/build-external";
import { ObecBuildContext, counter } from "../../src/migration/build-obec";
import { Municipality } from "../../src/street-markdown/types";

const B = (x: number, y: number): [number, number] => [
  14.4 + x * 0.01,
  50.0 + y * 0.01,
];
const addr = (address: string, x: number, y: number) => {
  const [lng, lat] = B(x, y);
  return { address, lng, lat };
};
const square = (x0: number, y0: number, x1: number, y1: number) => [
  [B(x0, y0), B(x1, y0), B(x1, y1), B(x0, y1), B(x0, y0)],
];

const OBEC = 554821;
const ctx = (problems: string[] = []): ObecBuildContext => ({
  obecKod: OBEC,
  typeCode: "1",
  allocObvodKod: counter(10001),
  allocOkrsekKod: counter(100001),
  allocId: counter(1),
  gradesByIzo: () => undefined,
  problems,
});

const obecBoundary = polygon(square(0, 0, 10, 10));

const municipality: Municipality = {
  municipalityName: "Ostrava",
  code: OBEC,
  municipalityType: "city",
  cityCodes: [OBEC],
  districtCodes: [],
  unmappedPoints: [],
  areas: [
    {
      index: 0,
      schools: [
        { name: "S1", izo: "600000001" },
        { name: "S2", izo: "600000002" },
      ],
      addresses: [addr("R1", 2, 8)],
    },
    {
      index: 1,
      schools: [{ name: "S1", izo: "600000001" }],
      addresses: [addr("A1", 2, 2), addr("A2", 3, 3)],
    },
    {
      index: 2,
      schools: [{ name: "S2", izo: "600000002" }],
      addresses: [addr("B1", 8, 2)],
    },
  ],
};

describe("buildExternalObecTables", () => {
  test("the city's polygons are the okrsky, each linked to its area's ŠO", () => {
    const polygons = featureCollection<Polygon | MultiPolygon>([
      // reaches past the obec boundary: clipped
      polygon(square(0, 5, 12, 10), { areaIndex: 0 }) as Feature<Polygon | MultiPolygon>,
      // touching parts: one okrsek
      multiPolygon([square(0, 0, 5, 5), square(5, 2, 10, 3)], { areaIndex: 1 }),
      // two separate parts, the second with no address of ours
      multiPolygon([square(5, 0, 10, 2), square(5, 3, 10, 5)], {
        areaIndex: 2,
      }),
    ]);
    const problems: string[] = [];

    const t = buildExternalObecTables(
      municipality,
      polygons,
      obecBoundary,
      ctx(problems)
    );

    expect(problems).toEqual([]);
    // one ŠO per area — the remainder area is its own two-school ŠO
    expect(t.obvody).toHaveLength(3);
    expect(t.skolaSko).toHaveLength(4);
    expect(t.okrsky).toHaveLength(4);
    expect(t.defBody).toHaveLength(4);
    expect(new Set(t.okrsky.map((o) => o.CISLO)).size).toBe(4);
    // both parts of area 2 belong to one ŠO
    const okrskyBySko = new Map<number, number>();
    for (const l of t.skoKo) {
      okrskyBySko.set(l.SKO_KOD, (okrskyBySko.get(l.SKO_KOD) ?? 0) + 1);
    }
    expect([...okrskyBySko.values()].sort()).toEqual([1, 1, 2]);
    // clipped to the obec: nothing east of x=10
    const maxLng = Math.max(
      ...t.hrany.flatMap((h) => h.geometry.coordinates.map(([lng]) => lng))
    );
    expect(maxLng).toBeLessThanOrEqual(B(10, 0)[0] + 1e-9);
    expect(t.hrany.length).toBeGreaterThanOrEqual(3);
    // def points inside the obec, the address-free part gets an interior point
    for (const { geometry } of t.defBody) {
      const [lng, lat] = geometry.coordinates;
      expect(lng).toBeGreaterThan(B(0, 0)[0]);
      expect(lng).toBeLessThan(B(10, 0)[0]);
      expect(lat).toBeGreaterThan(B(0, 0)[1]);
      expect(lat).toBeLessThan(B(0, 10)[1]);
    }
  });

  test("reports a polygon of an area the map data doesn't have", () => {
    const polygons = featureCollection<Polygon | MultiPolygon>([
      polygon(square(0, 0, 10, 10), { areaIndex: 7 }),
      polygon(square(0, 0, 5, 5), { areaIndex: 1 }),
    ]);
    const problems: string[] = [];

    buildExternalObecTables(municipality, polygons, obecBoundary, ctx(problems));

    expect(problems).toEqual([
      `obec ${OBEC} type 1: polygon of area 7 has no such area in the map data`,
    ]);
  });
});
