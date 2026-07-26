import Database from "better-sqlite3";
import { rmSync, writeFileSync } from "fs";
import { join } from "path";
import { LineString, Point, Position } from "@turf/helpers";
import {
  MigDefBodKo,
  MigHranKo,
  MigrationExport,
  MigSkolaSko,
  MigSkolskyObvod,
  MigSkolskyOkrsek,
  MigSkoKo,
  MigVymezeniZbylychKo,
} from "./types";

/**
 * C-7 — serialize a whole {@link MigrationExport} to a single GeoPackage plus a
 * CSV mirror.
 *
 * The GeoPackage is hand-rolled over `better-sqlite3` (no GDAL dependency): the
 * two geometry tables (`MIG_DEF_BOD_KO` points, `MIG_HRAN_KO` lines) are written
 * as GeoPackage `features` layers with StandardGeoPackageBinary blobs, the rest
 * as `attributes` tables. Everything is in **WGS-84 (EPSG:4326)** — ČÚZK
 * reprojects to 5514 with GDAL on their side.
 *
 * Determinism: rows are written in the order given, and `lastChange` is a fixed,
 * injectable constant so re-running on unchanged input yields a byte-identical
 * file (SQLite page layout aside).
 */

const WGS84 = 4326;
const GPKG_APPLICATION_ID = 0x47504b47; // "GPKG"
const GPKG_USER_VERSION = 10300; // GeoPackage 1.3.0
/** Fixed timestamp for reproducible output; override for a real handover stamp. */
const DEFAULT_LAST_CHANGE = "2026-01-01T00:00:00.000Z";

export interface WriteOptions {
  lastChange?: string;
}

export const writeGeoPackage = (
  data: MigrationExport,
  path: string,
  options: WriteOptions = {}
): void => {
  const lastChange = options.lastChange ?? DEFAULT_LAST_CHANGE;
  // start from a clean file — re-opening an existing .gpkg would fail on the
  // CREATE TABLE of the spec tables (and mixing old rows in is never intended)
  rmSync(path, { force: true });
  const db = new Database(path);
  try {
    db.pragma(`application_id = ${GPKG_APPLICATION_ID}`);
    db.pragma(`user_version = ${GPKG_USER_VERSION}`);
    db.exec("PRAGMA foreign_keys = OFF");

    createSpecTables(db);
    seedSpatialRefSys(db);

    const registerAttributes = registerContents(db, lastChange, null);
    const registerFeatures = registerContents(db, lastChange, WGS84);

    // --- attribute (non-spatial) tables
    writeSkolskyObvod(db, data.obvody);
    registerAttributes("MIG_SKOLSKY_OBVOD");

    writeSkolskyOkrsek(db, data.okrsky);
    registerAttributes("MIG_SKOLSKY_OKRSEK");

    writeSkoKo(db, data.skoKo);
    registerAttributes("MIG_SKO_KO");

    writeSkolaSko(db, data.skolaSko);
    registerAttributes("MIG_SKOLA_SKO");

    writeVymezeni(db, data.vymezeni);
    registerAttributes("MIG_VYMEZENI_ZBYLYCH_KO");

    // --- feature (spatial) tables
    const defBox = writeDefBodKo(db, data.defBody);
    registerFeatures("MIG_DEF_BOD_KO", defBox);
    registerGeometryColumn(db, "MIG_DEF_BOD_KO", "POINT");

    const hranBox = writeHranKo(db, data.hrany);
    registerFeatures("MIG_HRAN_KO", hranBox);
    registerGeometryColumn(db, "MIG_HRAN_KO", "LINESTRING");
  } finally {
    db.close();
  }
};

/** Emit one CSV per MIG_* table into `dir`; geometry columns become WKT. */
export const writeCsvMirror = (data: MigrationExport, dir: string): void => {
  writeCsv(dir, "MIG_SKOLSKY_OBVOD", OBVOD_COLS, data.obvody);
  writeCsv(dir, "MIG_SKOLSKY_OKRSEK", OKRSEK_COLS, data.okrsky);
  writeCsv(dir, "MIG_SKO_KO", SKO_KO_COLS, data.skoKo);
  writeCsv(dir, "MIG_SKOLA_SKO", SKOLA_SKO_COLS, data.skolaSko);
  writeCsv(dir, "MIG_VYMEZENI_ZBYLYCH_KO", VYMEZENI_COLS, data.vymezeni);
  writeCsv(
    dir,
    "MIG_DEF_BOD_KO",
    ["ID", "KO_KOD", "geometry"],
    data.defBody.map((r) => ({
      ID: r.ID,
      KO_KOD: r.KO_KOD,
      geometry: pointWkt(r.geometry),
    }))
  );
  writeCsv(
    dir,
    "MIG_HRAN_KO",
    ["ID", "KO_KOD1", "KO_KOD2", "geometry"],
    data.hrany.map((r) => ({
      ID: r.ID,
      KO_KOD1: r.KO_KOD1,
      KO_KOD2: r.KO_KOD2,
      geometry: lineStringWkt(r.geometry),
    }))
  );
};

// ---------------------------------------------------------------------------
// GeoPackage spec tables
// ---------------------------------------------------------------------------

const createSpecTables = (db: Database.Database): void => {
  db.exec(`
    CREATE TABLE gpkg_spatial_ref_sys (
      srs_name TEXT NOT NULL,
      srs_id INTEGER NOT NULL PRIMARY KEY,
      organization TEXT NOT NULL,
      organization_coordsys_id INTEGER NOT NULL,
      definition TEXT NOT NULL,
      description TEXT
    );
    CREATE TABLE gpkg_contents (
      table_name TEXT NOT NULL PRIMARY KEY,
      data_type TEXT NOT NULL,
      identifier TEXT UNIQUE,
      description TEXT DEFAULT '',
      last_change TEXT NOT NULL,
      min_x DOUBLE, min_y DOUBLE, max_x DOUBLE, max_y DOUBLE,
      srs_id INTEGER,
      CONSTRAINT fk_gc_r_srs_id FOREIGN KEY (srs_id)
        REFERENCES gpkg_spatial_ref_sys(srs_id)
    );
    CREATE TABLE gpkg_geometry_columns (
      table_name TEXT NOT NULL,
      column_name TEXT NOT NULL,
      geometry_type_name TEXT NOT NULL,
      srs_id INTEGER NOT NULL,
      z TINYINT NOT NULL,
      m TINYINT NOT NULL,
      CONSTRAINT pk_geom_cols PRIMARY KEY (table_name, column_name),
      CONSTRAINT fk_gc_tn FOREIGN KEY (table_name)
        REFERENCES gpkg_contents(table_name)
    );
  `);
};

const seedSpatialRefSys = (db: Database.Database): void => {
  const insert = db.prepare(
    `INSERT INTO gpkg_spatial_ref_sys
       (srs_name, srs_id, organization, organization_coordsys_id, definition, description)
     VALUES (@srs_name, @srs_id, @organization, @organization_coordsys_id, @definition, @description)`
  );
  // The two records the spec mandates, plus WGS-84.
  insert.run({
    srs_name: "Undefined cartesian SRS",
    srs_id: -1,
    organization: "NONE",
    organization_coordsys_id: -1,
    definition: "undefined",
    description: "undefined cartesian coordinate reference system",
  });
  insert.run({
    srs_name: "Undefined geographic SRS",
    srs_id: 0,
    organization: "NONE",
    organization_coordsys_id: 0,
    definition: "undefined",
    description: "undefined geographic coordinate reference system",
  });
  insert.run({
    srs_name: "WGS 84 geodetic",
    srs_id: WGS84,
    organization: "EPSG",
    organization_coordsys_id: WGS84,
    definition: WGS84_WKT,
    description: "longitude/latitude coordinates in decimal degrees on WGS 84",
  });
};

/**
 * Returns a helper that registers a table in gpkg_contents. `srsId === null`
 * marks a non-spatial `attributes` table (NULL srs / bounds); otherwise a
 * `features` table carrying its bounding box.
 */
const registerContents =
  (db: Database.Database, lastChange: string, srsId: number | null) =>
  (tableName: string, box?: BBox): void => {
    db.prepare(
      `INSERT INTO gpkg_contents
         (table_name, data_type, identifier, description, last_change,
          min_x, min_y, max_x, max_y, srs_id)
       VALUES (@table_name, @data_type, @identifier, '', @last_change,
          @min_x, @min_y, @max_x, @max_y, @srs_id)`
    ).run({
      table_name: tableName,
      data_type: srsId === null ? "attributes" : "features",
      identifier: tableName,
      last_change: lastChange,
      min_x: box ? box.minX : null,
      min_y: box ? box.minY : null,
      max_x: box ? box.maxX : null,
      max_y: box ? box.maxY : null,
      srs_id: srsId,
    });
  };

const registerGeometryColumn = (
  db: Database.Database,
  tableName: string,
  geometryType: "POINT" | "LINESTRING"
): void => {
  db.prepare(
    `INSERT INTO gpkg_geometry_columns
       (table_name, column_name, geometry_type_name, srs_id, z, m)
     VALUES (?, 'geom', ?, ?, 0, 0)`
  ).run(tableName, geometryType, WGS84);
};

// ---------------------------------------------------------------------------
// Attribute tables
// ---------------------------------------------------------------------------

const writeSkolskyObvod = (
  db: Database.Database,
  rows: MigSkolskyObvod[]
): void => {
  db.exec(`CREATE TABLE MIG_SKOLSKY_OBVOD (
    KOD INTEGER PRIMARY KEY, NAZEV TEXT, POZNAMKA TEXT,
    OBEC_KOD INTEGER, TYP_OBVODU_KOD TEXT
  )`);
  const stmt = db.prepare(
    `INSERT INTO MIG_SKOLSKY_OBVOD VALUES (@KOD, @NAZEV, @POZNAMKA, @OBEC_KOD, @TYP_OBVODU_KOD)`
  );
  insertAll(db, stmt, rows);
};

const writeSkolskyOkrsek = (
  db: Database.Database,
  rows: MigSkolskyOkrsek[]
): void => {
  db.exec(`CREATE TABLE MIG_SKOLSKY_OKRSEK (
    KOD INTEGER PRIMARY KEY, KOD_ISUI INTEGER, NAZEV TEXT, CISLO INTEGER,
    POZNAMKA TEXT, OBEC_KOD INTEGER, TYP_OBVODU_KOD TEXT
  )`);
  const stmt = db.prepare(
    `INSERT INTO MIG_SKOLSKY_OKRSEK VALUES
       (@KOD, @KOD_ISUI, @NAZEV, @CISLO, @POZNAMKA, @OBEC_KOD, @TYP_OBVODU_KOD)`
  );
  insertAll(db, stmt, rows);
};

const writeSkoKo = (db: Database.Database, rows: MigSkoKo[]): void => {
  db.exec(`CREATE TABLE MIG_SKO_KO (
    fid INTEGER PRIMARY KEY, SKO_KOD INTEGER, KO_KOD INTEGER
  )`);
  const stmt = db.prepare(
    `INSERT INTO MIG_SKO_KO VALUES (@fid, @SKO_KOD, @KO_KOD)`
  );
  insertAll(
    db,
    stmt,
    rows.map((r, i) => ({ fid: i + 1, ...r }))
  );
};

const writeSkolaSko = (db: Database.Database, rows: MigSkolaSko[]): void => {
  db.exec(`CREATE TABLE MIG_SKOLA_SKO (
    fid INTEGER PRIMARY KEY, SKO_KOD INTEGER, SKOLA_IZO INTEGER,
    TRIDA_1 TEXT, TRIDA_2 TEXT, TRIDA_3 TEXT, TRIDA_4 TEXT, TRIDA_5 TEXT,
    TRIDA_6 TEXT, TRIDA_7 TEXT, TRIDA_8 TEXT, TRIDA_9 TEXT
  )`);
  const stmt = db.prepare(
    `INSERT INTO MIG_SKOLA_SKO VALUES
       (@fid, @SKO_KOD, @SKOLA_IZO, @TRIDA_1, @TRIDA_2, @TRIDA_3, @TRIDA_4,
        @TRIDA_5, @TRIDA_6, @TRIDA_7, @TRIDA_8, @TRIDA_9)`
  );
  insertAll(
    db,
    stmt,
    rows.map((r, i) => ({ fid: i + 1, ...r }))
  );
};

const writeVymezeni = (
  db: Database.Database,
  rows: MigVymezeniZbylychKo[]
): void => {
  db.exec(`CREATE TABLE MIG_VYMEZENI_ZBYLYCH_KO (
    OBEC_KOD INTEGER PRIMARY KEY, SKO_KOD INTEGER
  )`);
  const stmt = db.prepare(
    `INSERT INTO MIG_VYMEZENI_ZBYLYCH_KO VALUES (@OBEC_KOD, @SKO_KOD)`
  );
  insertAll(db, stmt, rows);
};

// ---------------------------------------------------------------------------
// Feature tables
// ---------------------------------------------------------------------------

const writeDefBodKo = (db: Database.Database, rows: MigDefBodKo[]): BBox => {
  db.exec(`CREATE TABLE MIG_DEF_BOD_KO (
    ID INTEGER PRIMARY KEY, KO_KOD INTEGER, geom BLOB
  )`);
  const stmt = db.prepare(
    `INSERT INTO MIG_DEF_BOD_KO VALUES (@ID, @KO_KOD, @geom)`
  );
  const box = emptyBBox();
  insertAll(
    db,
    stmt,
    rows.map((r) => {
      const [x, y] = r.geometry.coordinates;
      extend(box, x, y);
      return {
        ID: r.ID,
        KO_KOD: r.KO_KOD,
        geom: pointBlob(r.geometry),
      };
    })
  );
  return box;
};

const writeHranKo = (db: Database.Database, rows: MigHranKo[]): BBox => {
  db.exec(`CREATE TABLE MIG_HRAN_KO (
    ID INTEGER PRIMARY KEY, KO_KOD1 INTEGER, KO_KOD2 INTEGER, geom BLOB
  )`);
  const stmt = db.prepare(
    `INSERT INTO MIG_HRAN_KO VALUES (@ID, @KO_KOD1, @KO_KOD2, @geom)`
  );
  const box = emptyBBox();
  insertAll(
    db,
    stmt,
    rows.map((r) => {
      for (const [x, y] of r.geometry.coordinates) extend(box, x, y);
      return {
        ID: r.ID,
        KO_KOD1: r.KO_KOD1,
        KO_KOD2: r.KO_KOD2,
        geom: lineStringBlob(r.geometry),
      };
    })
  );
  return box;
};

const insertAll = <T>(
  db: Database.Database,
  stmt: Database.Statement,
  rows: T[]
): void => {
  const run = db.transaction((all: T[]) => {
    for (const row of all) stmt.run(row as Record<string, unknown>);
  });
  run(rows);
};

// ---------------------------------------------------------------------------
// GeoPackage binary geometry (StandardGeoPackageBinary, little-endian, XY envelope)
// ---------------------------------------------------------------------------

const WKB_POINT = 1;
const WKB_LINESTRING = 2;

const pointBlob = (point: Point): Buffer => {
  const [x, y] = point.coordinates;
  return geoPackageBlob(bboxOf([point.coordinates]), wkbPoint(x, y));
};

const lineStringBlob = (line: LineString): Buffer =>
  geoPackageBlob(bboxOf(line.coordinates), wkbLineString(line.coordinates));

const geoPackageBlob = (box: BBox, wkb: Buffer): Buffer => {
  const header = Buffer.alloc(8 + 32);
  header[0] = 0x47; // "G"
  header[1] = 0x50; // "P"
  header[2] = 0x00; // version 0
  header[3] = 0x03; // flags: little-endian ints + XY envelope (code 1)
  header.writeInt32LE(WGS84, 4);
  header.writeDoubleLE(box.minX, 8);
  header.writeDoubleLE(box.maxX, 16);
  header.writeDoubleLE(box.minY, 24);
  header.writeDoubleLE(box.maxY, 32);
  return Buffer.concat([header, wkb]);
};

const wkbPoint = (x: number, y: number): Buffer => {
  const b = Buffer.alloc(1 + 4 + 16);
  b.writeUInt8(1, 0); // little-endian
  b.writeUInt32LE(WKB_POINT, 1);
  b.writeDoubleLE(x, 5);
  b.writeDoubleLE(y, 13);
  return b;
};

const wkbLineString = (coords: Position[]): Buffer => {
  const b = Buffer.alloc(1 + 4 + 4 + coords.length * 16);
  b.writeUInt8(1, 0);
  b.writeUInt32LE(WKB_LINESTRING, 1);
  b.writeUInt32LE(coords.length, 5);
  let offset = 9;
  for (const [x, y] of coords) {
    b.writeDoubleLE(x, offset);
    b.writeDoubleLE(y, offset + 8);
    offset += 16;
  }
  return b;
};

// ---------------------------------------------------------------------------
// WKT (for the CSV mirror)
// ---------------------------------------------------------------------------

const pointWkt = (point: Point): string => {
  const [x, y] = point.coordinates;
  return `POINT (${x} ${y})`;
};

const lineStringWkt = (line: LineString): string =>
  `LINESTRING (${line.coordinates.map(([x, y]) => `${x} ${y}`).join(", ")})`;

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

const writeCsv = <T>(
  dir: string,
  name: string,
  columns: readonly string[],
  rows: T[]
): void => {
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(
      columns
        .map((c) => csvCell((row as Record<string, unknown>)[c]))
        .join(",")
    );
  }
  writeFileSync(join(dir, `${name}.csv`), lines.join("\n") + "\n", "utf8");
};

const csvCell = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const OBVOD_COLS = [
  "KOD",
  "NAZEV",
  "POZNAMKA",
  "OBEC_KOD",
  "TYP_OBVODU_KOD",
] as const;
const OKRSEK_COLS = [
  "KOD",
  "KOD_ISUI",
  "NAZEV",
  "CISLO",
  "POZNAMKA",
  "OBEC_KOD",
  "TYP_OBVODU_KOD",
] as const;
const SKO_KO_COLS = ["SKO_KOD", "KO_KOD"] as const;
const SKOLA_SKO_COLS = [
  "SKO_KOD",
  "SKOLA_IZO",
  "TRIDA_1",
  "TRIDA_2",
  "TRIDA_3",
  "TRIDA_4",
  "TRIDA_5",
  "TRIDA_6",
  "TRIDA_7",
  "TRIDA_8",
  "TRIDA_9",
] as const;
const VYMEZENI_COLS = ["OBEC_KOD", "SKO_KOD"] as const;

// ---------------------------------------------------------------------------
// BBox helpers
// ---------------------------------------------------------------------------

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const emptyBBox = (): BBox => ({
  minX: Infinity,
  minY: Infinity,
  maxX: -Infinity,
  maxY: -Infinity,
});

const extend = (box: BBox, x: number, y: number): void => {
  if (x < box.minX) box.minX = x;
  if (y < box.minY) box.minY = y;
  if (x > box.maxX) box.maxX = x;
  if (y > box.maxY) box.maxY = y;
};

const bboxOf = (coords: Position[]): BBox => {
  const box = emptyBBox();
  for (const [x, y] of coords) extend(box, x, y);
  return box;
};

const WGS84_WKT =
  'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,' +
  'AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],' +
  'PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],' +
  'UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],' +
  'AUTHORITY["EPSG","4326"]]';
