import { describe, expect, test } from "@jest/globals";
import { featureCollection, multiPolygon, polygon } from "@turf/helpers";
import { PolygonsByCodes } from "../../src/db/types";
import { counter } from "../../src/migration/build-obec";
import { explicitOverlappingVymezeni } from "../../src/migration/explicit-overlap";
import { assembleExport, ExportGroup } from "../../src/migration/run";
import { checkIntegrity } from "../../src/migration/self-check";
import { checkSeamTopology } from "../../src/migration/topology-check";
import { getObecBoundary } from "../../src/street-markdown/polygons";
import { MigrationExport } from "../../src/migration/types";
import { Municipality } from "../../src/street-markdown/types";

const B = (x: number, y: number): [number, number] => [
  14.4 + x * 0.01,
  50.0 + y * 0.01,
];
const addr = (address: string, x: number, y: number) => {
  const [lng, lat] = B(x, y);
  return { address, lng, lat };
};
const square = (x: number, y: number, size: number) =>
  [[B(x, y), B(x + size, y), B(x + size, y + size), B(x, y + size), B(x, y)]];

const townKod = 800001;
const villageKod = 800002;
// the village is a multipolygon: a main part and an exclave
const villageParts = [square(12, 0, 4), square(12, 6, 2)];
const cityPolygons: PolygonsByCodes = {
  [townKod]: featureCollection([polygon(square(0, 0, 10))]),
  [villageKod]: featureCollection([multiPolygon(villageParts)]),
};

// Kolín pattern: two town schools, both declaring the whole village.
const town = (absorbing: number[]): Municipality => ({
  municipalityName: "Town",
  code: townKod,
  municipalityType: "city",
  cityCodes: [townKod, villageKod],
  districtCodes: [],
  unmappedPoints: [],
  areas: [
    { index: 0, schools: [{ name: "ZŠ 1", izo: "600000001" }], addresses: [addr("A1", 2, 2), addr("A2", 2, 8), addr("V1", 13, 1)], absorbedWholeObce: absorbing.includes(0) ? [villageKod] : [] },
    { index: 1, schools: [{ name: "ZŠ 2", izo: "600000002" }], addresses: [addr("B1", 8, 2), addr("B2", 8, 8), addr("V1", 13, 1)], absorbedWholeObce: absorbing.includes(1) ? [villageKod] : [] },
  ],
});

describe("explicitOverlappingVymezeni (ČÚZK Q-overlap)", () => {
  const groups: ExportGroup[] = [
    { municipalities: [town([0, 1])], typeCode: "1" },
    { municipalities: [town([0])], typeCode: "M" },
  ];
  const data = assembleExport(groups, cityPolygons, {}, new Map());
  const typeOf = new Map(data.obvody.map((o) => [o.KOD, o.TYP_OBVODU_KOD]));
  const villageOkrsky = data.okrsky.filter((o) => o.OBEC_KOD === villageKod);

  test("an overlapping type becomes one explicit okrsek per polygon part, linked to every ŠO", () => {
    expect(villageOkrsky).toHaveLength(2);
    expect(villageOkrsky.every((o) => o.TYP_OBVODU_KOD === "1")).toBe(true);
    expect(villageOkrsky.map((o) => o.CISLO)).toEqual([1, 2]);

    const type1Obvody = data.obvody.filter((o) => o.TYP_OBVODU_KOD === "1").map((o) => o.KOD);
    for (const ko of villageOkrsky) {
      const linked = data.skoKo.filter((l) => l.KO_KOD === ko.KOD).map((l) => l.SKO_KOD);
      expect(linked.sort()).toEqual(type1Obvody.sort());
    }
    // no seams; one def point inside each part
    const villageKods = new Set(villageOkrsky.map((o) => o.KOD));
    expect(data.hrany.some((h) => villageKods.has(h.KO_KOD1) || villageKods.has(h.KO_KOD2))).toBe(false);
    villageOkrsky.forEach((ko, i) => {
      const defs = data.defBody.filter((d) => d.KO_KOD === ko.KOD);
      expect(defs).toHaveLength(1);
      // the parts are squares: inside == within the bounding box
      const [x, y] = defs[0].geometry.coordinates;
      const [[minX, minY], , [maxX, maxY]] = villageParts[i][0];
      expect(x > minX && x < maxX && y > minY && y < maxY).toBe(true);
    });
  });

  test("a non-overlapping type in the same obec keeps its vymezení row", () => {
    const villageRows = data.vymezeni.filter((v) => v.OBEC_KOD === villageKod && v.SKO_KOD !== null);
    expect(villageRows).toHaveLength(1);
    expect(typeOf.get(villageRows[0].SKO_KOD!)).toBe("M");
  });

  test("passes the self-check and the local MI10 check", () => {
    expect(checkIntegrity(data)).toEqual([]);
    const boundaries = new Map([[villageKod, getObecBoundary(cityPolygons, villageKod)!]]);
    expect(checkSeamTopology(data, boundaries)).toEqual([]);
  });

  test("numbers after the obec's existing okrsky and leaves single rows alone", () => {
    const input: MigrationExport = {
      obvody: [10001, 10002, 10003].map((KOD) => ({ KOD, NAZEV: null, POZNAMKA: null, OBEC_KOD: townKod, TYP_OBVODU_KOD: KOD === 10003 ? "2" : "1" })),
      okrsky: [{ KOD: 100001, KOD_ISUI: null, NAZEV: null, CISLO: 3, POZNAMKA: null, OBEC_KOD: villageKod, TYP_OBVODU_KOD: "M" }],
      skoKo: [],
      defBody: [],
      hrany: [],
      skolaSko: [],
      vymezeni: [
        { OBEC_KOD: villageKod, SKO_KOD: 10001 },
        { OBEC_KOD: villageKod, SKO_KOD: 10002 },
        { OBEC_KOD: villageKod, SKO_KOD: 10003 },
        { OBEC_KOD: villageKod, SKO_KOD: null },
      ],
    };
    const out = explicitOverlappingVymezeni(input, cityPolygons, counter(200001), counter(1));
    expect(out.okrsky.slice(1).map((o) => [o.KOD, o.CISLO, o.TYP_OBVODU_KOD])).toEqual([
      [200001, 4, "1"],
      [200002, 5, "1"],
    ]);
    expect(out.vymezeni).toEqual([
      { OBEC_KOD: villageKod, SKO_KOD: 10003 },
      { OBEC_KOD: villageKod, SKO_KOD: null },
    ]);
  });

  test("returns the export unchanged when nothing overlaps", () => {
    const input: MigrationExport = {
      obvody: [], okrsky: [], skoKo: [], defBody: [], hrany: [], skolaSko: [],
      vymezeni: [{ OBEC_KOD: villageKod, SKO_KOD: null }],
    };
    expect(explicitOverlappingVymezeni(input, {}, counter(1), counter(1))).toBe(input);
  });
});
