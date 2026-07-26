import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import Database from "better-sqlite3";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  writeCsvMirror,
  writeGeoPackage,
} from "../../src/migration/geopackage";
import { MigrationExport } from "../../src/migration/types";

const data: MigrationExport = {
  obvody: [
    {
      KOD: 10001,
      NAZEV: null,
      POZNAMKA: null,
      OBEC_KOD: 500001,
      TYP_OBVODU_KOD: "1",
    },
  ],
  okrsky: [
    {
      KOD: 100001,
      KOD_ISUI: null,
      NAZEV: null,
      CISLO: 1,
      POZNAMKA: null,
      OBEC_KOD: 500001,
      TYP_OBVODU_KOD: "1",
    },
    {
      KOD: 100002,
      KOD_ISUI: null,
      NAZEV: null,
      CISLO: 2,
      POZNAMKA: null,
      OBEC_KOD: 500001,
      TYP_OBVODU_KOD: "1",
    },
  ],
  skoKo: [
    { SKO_KOD: 10001, KO_KOD: 100001 },
    { SKO_KOD: 10001, KO_KOD: 100002 },
  ],
  defBody: [
    {
      ID: 1,
      KO_KOD: 100001,
      geometry: { type: "Point", coordinates: [14.42, 50.02] },
    },
    {
      ID: 2,
      KO_KOD: 100002,
      geometry: { type: "Point", coordinates: [14.48, 50.08] },
    },
  ],
  hrany: [
    {
      ID: 3,
      KO_KOD1: 100001,
      KO_KOD2: 100002,
      geometry: {
        type: "LineString",
        coordinates: [
          [14.45, 50.0],
          [14.45, 50.1],
        ],
      },
    },
  ],
  skolaSko: [
    {
      SKO_KOD: 10001,
      SKOLA_IZO: 600001111,
      TRIDA_1: "A",
      TRIDA_2: "A",
      TRIDA_3: "A",
      TRIDA_4: "A",
      TRIDA_5: "A",
      TRIDA_6: "N",
      TRIDA_7: "N",
      TRIDA_8: "N",
      TRIDA_9: "N",
    },
  ],
  vymezeni: [{ OBEC_KOD: 500002, SKO_KOD: 10001 }],
};

let dir: string;
let gpkgPath: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "gpkg-test-"));
  gpkgPath = join(dir, "export.gpkg");
  writeGeoPackage(data, gpkgPath);
  writeCsvMirror(data, dir);
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("writeGeoPackage", () => {
  test("stamps the GeoPackage magic + version pragmas", () => {
    const db = new Database(gpkgPath, { readonly: true });
    expect(db.pragma("application_id", { simple: true })).toBe(0x47504b47);
    expect(db.pragma("user_version", { simple: true })).toBe(10300);
    db.close();
  });

  test("registers every table in gpkg_contents with the right data_type", () => {
    const db = new Database(gpkgPath, { readonly: true });
    const rows = db
      .prepare("SELECT table_name, data_type, srs_id FROM gpkg_contents")
      .all() as { table_name: string; data_type: string; srs_id: number | null }[];
    const byName = new Map(rows.map((r) => [r.table_name, r]));

    for (const t of [
      "MIG_SKOLSKY_OBVOD",
      "MIG_SKOLSKY_OKRSEK",
      "MIG_SKO_KO",
      "MIG_SKOLA_SKO",
      "MIG_VYMEZENI_ZBYLYCH_KO",
    ]) {
      expect(byName.get(t)?.data_type).toBe("attributes");
      expect(byName.get(t)?.srs_id).toBeNull();
    }
    for (const t of ["MIG_DEF_BOD_KO", "MIG_HRAN_KO"]) {
      expect(byName.get(t)?.data_type).toBe("features");
      expect(byName.get(t)?.srs_id).toBe(4326);
    }
    db.close();
  });

  test("declares the geometry columns as POINT/LINESTRING in WGS-84", () => {
    const db = new Database(gpkgPath, { readonly: true });
    const rows = db
      .prepare(
        "SELECT table_name, column_name, geometry_type_name, srs_id FROM gpkg_geometry_columns"
      )
      .all() as {
      table_name: string;
      column_name: string;
      geometry_type_name: string;
      srs_id: number;
    }[];
    const byName = new Map(rows.map((r) => [r.table_name, r]));

    expect(byName.get("MIG_DEF_BOD_KO")).toMatchObject({
      column_name: "geom",
      geometry_type_name: "POINT",
      srs_id: 4326,
    });
    expect(byName.get("MIG_HRAN_KO")).toMatchObject({
      column_name: "geom",
      geometry_type_name: "LINESTRING",
      srs_id: 4326,
    });
    db.close();
  });

  test("round-trips a point geometry blob", () => {
    const db = new Database(gpkgPath, { readonly: true });
    const row = db
      .prepare("SELECT geom FROM MIG_DEF_BOD_KO WHERE ID = 1")
      .get() as { geom: Buffer };
    const { srsId, wkb } = parseGpkgBlob(row.geom);
    expect(srsId).toBe(4326);
    const [x, y] = parseWkbPoint(wkb);
    expect(x).toBeCloseTo(14.42, 10);
    expect(y).toBeCloseTo(50.02, 10);
    db.close();
  });

  test("round-trips a linestring geometry blob", () => {
    const db = new Database(gpkgPath, { readonly: true });
    const row = db
      .prepare("SELECT geom FROM MIG_HRAN_KO WHERE ID = 3")
      .get() as { geom: Buffer };
    const coords = parseWkbLineString(parseGpkgBlob(row.geom).wkb);
    expect(coords).toEqual([
      [14.45, 50.0],
      [14.45, 50.1],
    ]);
    db.close();
  });

  test("preserves attribute rows verbatim", () => {
    const db = new Database(gpkgPath, { readonly: true });
    expect(
      db.prepare("SELECT TRIDA_5, TRIDA_6 FROM MIG_SKOLA_SKO").get()
    ).toEqual({ TRIDA_5: "A", TRIDA_6: "N" });
    expect(
      (db.prepare("SELECT COUNT(*) c FROM MIG_SKO_KO").get() as { c: number }).c
    ).toBe(2);
    db.close();
  });

  test("overwrites an existing .gpkg instead of failing", () => {
    const p = join(dir, "overwrite.gpkg");
    writeGeoPackage(data, p);
    expect(() => writeGeoPackage(data, p)).not.toThrow();
    const db = new Database(p, { readonly: true });
    expect(
      (db.prepare("SELECT COUNT(*) c FROM MIG_SKOLSKY_OBVOD").get() as { c: number }).c
    ).toBe(data.obvody.length);
    db.close();
  });

  test("is byte-identical for unchanged input (deterministic)", () => {
    const a = join(dir, "a.gpkg");
    const b = join(dir, "b.gpkg");
    writeGeoPackage(data, a);
    writeGeoPackage(data, b);
    expect(readFileSync(a).equals(readFileSync(b))).toBe(true);
  });
});

describe("writeCsvMirror", () => {
  test("writes a WKT geometry column for spatial tables", () => {
    const csv = readFileSync(join(dir, "MIG_HRAN_KO.csv"), "utf8");
    expect(csv.split("\n")[0]).toBe("ID,KO_KOD1,KO_KOD2,geometry");
    expect(csv).toContain("LINESTRING (14.45 50, 14.45 50.1)");
  });

  test("mirrors attribute tables", () => {
    const csv = readFileSync(join(dir, "MIG_SKOLSKY_OBVOD.csv"), "utf8");
    expect(csv.split("\n")[0]).toBe("KOD,NAZEV,POZNAMKA,OBEC_KOD,TYP_OBVODU_KOD");
    expect(csv).toContain("10001,,,500001,1");
  });
});

// --- minimal GeoPackage / WKB reader for the round-trip assertions ---

const parseGpkgBlob = (blob: Buffer): { srsId: number; wkb: Buffer } => {
  expect(blob[0]).toBe(0x47); // "G"
  expect(blob[1]).toBe(0x50); // "P"
  const flags = blob[3];
  const envelopeCode = (flags >> 1) & 0x07;
  const envelopeBytes = envelopeCode === 0 ? 0 : envelopeCode === 1 ? 32 : -1;
  expect(envelopeBytes).toBeGreaterThanOrEqual(0);
  const srsId = blob.readInt32LE(4);
  return { srsId, wkb: blob.subarray(8 + envelopeBytes) };
};

const parseWkbPoint = (wkb: Buffer): [number, number] => {
  expect(wkb.readUInt8(0)).toBe(1); // little-endian
  expect(wkb.readUInt32LE(1)).toBe(1); // Point
  return [wkb.readDoubleLE(5), wkb.readDoubleLE(13)];
};

const parseWkbLineString = (wkb: Buffer): [number, number][] => {
  expect(wkb.readUInt32LE(1)).toBe(2); // LineString
  const n = wkb.readUInt32LE(5);
  const out: [number, number][] = [];
  let offset = 9;
  for (let i = 0; i < n; i++) {
    out.push([wkb.readDoubleLE(offset), wkb.readDoubleLE(offset + 8)]);
    offset += 16;
  }
  return out;
};
