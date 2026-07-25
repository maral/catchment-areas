import { describe, expect, test } from "@jest/globals";
import { featureCollection, polygon } from "@turf/helpers";
import { PolygonsByCodes } from "../../src/db/types";
import { assembleExport, ExportGroup } from "../../src/migration/run";
import { Municipality } from "../../src/street-markdown/types";

const B = (x: number, y: number): [number, number] => [
  14.4 + x * 0.01,
  50.0 + y * 0.01,
];
const addr = (address: string, x: number, y: number) => {
  const [lng, lat] = B(x, y);
  return { address, lng, lat };
};
const square = polygon([[B(0, 0), B(10, 0), B(10, 10), B(0, 10), B(0, 0)]]);

// A complex obec (two schools -> tessellated) exported as type "1".
const obecA: Municipality = {
  municipalityName: "A",
  code: 500001,
  municipalityType: "city",
  cityCodes: [500001],
  districtCodes: [],
  unmappedPoints: [],
  areas: [
    { index: 0, schools: [{ name: "A-Left", izo: "600000001" }], addresses: [addr("AL1", 2, 2), addr("AL2", 2, 8)] },
    { index: 1, schools: [{ name: "A-Right", izo: "600000002" }], addresses: [addr("AR1", 8, 2), addr("AR2", 8, 8)] },
  ],
};

// A trivial obec (one area = whole obec) exported as type "M".
const obecB: Municipality = {
  municipalityName: "B",
  code: 500002,
  municipalityType: "city",
  cityCodes: [500002],
  districtCodes: [],
  unmappedPoints: [],
  areas: [
    { index: 0, schools: [{ name: "B-Only", izo: "600000009" }], addresses: [addr("B1", 5, 5)] },
  ],
};

const boundaries: PolygonsByCodes = {
  500001: featureCollection([square]),
  500002: featureCollection([square]),
};

const groups: ExportGroup[] = [
  { municipalities: [obecA], typeCode: "1" },
  { municipalities: [obecB], typeCode: "M" },
];

describe("assembleExport (multi-group, shared code space)", () => {
  test("produces one export spanning both types with globally-unique codes", () => {
    const data = assembleExport(groups, boundaries, {});

    // 3 obvody total: 2 from A (type 1), 1 from B (type M)
    expect(data.obvody).toHaveLength(3);
    const kods = data.obvody.map((o) => o.KOD);
    expect(new Set(kods).size).toBe(3); // no collisions across groups

    // types carried per group
    const typesByKod = new Map(data.obvody.map((o) => [o.KOD, o.TYP_OBVODU_KOD]));
    expect(data.obvody.filter((o) => o.OBEC_KOD === 500001).every((o) => o.TYP_OBVODU_KOD === "1")).toBe(true);
    expect(data.obvody.filter((o) => o.OBEC_KOD === 500002).every((o) => o.TYP_OBVODU_KOD === "M")).toBe(true);

    // A tessellates; B is trivial -> vymezeni, no okrsky of its own
    expect(data.okrsky.length).toBeGreaterThan(0);
    for (const ok of data.okrsky) expect(ok.OBEC_KOD).toBe(500001);
    expect(data.vymezeni).toHaveLength(1);
    expect(data.vymezeni[0].OBEC_KOD).toBe(500002);

    // okrsek codes disjoint from obvod codes (different allocators/spaces)
    const okrsekKods = new Set(data.okrsky.map((o) => o.KOD));
    for (const k of kods) expect(okrsekKods.has(k)).toBe(false);
    // sanity: the trivial obvod is the vymezeni target and is a real obvod
    expect(typesByKod.has(data.vymezeni[0].SKO_KOD!)).toBe(true);
  });

  test("is deterministic across runs", () => {
    expect(assembleExport(groups, boundaries, {})).toEqual(
      assembleExport(groups, boundaries, {})
    );
  });
});
