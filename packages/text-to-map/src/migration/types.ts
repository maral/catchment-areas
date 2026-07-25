import { LineString, Point } from "@turf/helpers";

/** School-obvod type: M = mateřská, 1 = 1. stupeň, 2 = 2. stupeň. */
export type SchoolTypeCode = "M" | "1" | "2";

/** Per-grade inclusion flag in MIG_SKOLA_SKO (Ano / Ne). */
export type TridaFlag = "A" | "N";

export interface MigSkolskyObvod {
  KOD: number;
  NAZEV: null;
  POZNAMKA: null;
  OBEC_KOD: number;
  TYP_OBVODU_KOD: SchoolTypeCode;
}

export interface MigSkolskyOkrsek {
  KOD: number;
  KOD_ISUI: null;
  NAZEV: null;
  CISLO: number;
  POZNAMKA: null;
  OBEC_KOD: number;
  TYP_OBVODU_KOD: SchoolTypeCode;
}

export interface MigSkoKo {
  SKO_KOD: number;
  KO_KOD: number;
}

export interface MigDefBodKo {
  ID: number;
  KO_KOD: number;
  /** GeoJSON point; serialized to the GeoPackage geometry column in C-7. */
  geometry: Point;
}

export interface MigHranKo {
  ID: number;
  KO_KOD1: number;
  KO_KOD2: number;
  /** GeoJSON linestring; serialized to the GeoPackage geometry column in C-7. */
  geometry: LineString;
}

export interface MigSkolaSko {
  SKO_KOD: number;
  SKOLA_IZO: number;
  TRIDA_1: TridaFlag;
  TRIDA_2: TridaFlag;
  TRIDA_3: TridaFlag;
  TRIDA_4: TridaFlag;
  TRIDA_5: TridaFlag;
  TRIDA_6: TridaFlag;
  TRIDA_7: TridaFlag;
  TRIDA_8: TridaFlag;
  TRIDA_9: TridaFlag;
}

export interface MigVymezeniZbylychKo {
  OBEC_KOD: number;
  SKO_KOD: number | null;
}

/** Grades a school teaches, from the ČÚZK registry CSV (t1..t9 = X / blank). */
export interface SchoolGrades {
  t1: boolean;
  t2: boolean;
  t3: boolean;
  t4: boolean;
  t5: boolean;
  t6: boolean;
  t7: boolean;
  t8: boolean;
  t9: boolean;
}

/** All MIG_* rows produced for one obec + type. */
export interface ObecTables {
  obvody: MigSkolskyObvod[];
  okrsky: MigSkolskyOkrsek[];
  skoKo: MigSkoKo[];
  defBody: MigDefBodKo[];
  hrany: MigHranKo[];
  skolaSko: MigSkolaSko[];
}

/**
 * All MIG_* rows for a whole migration run (every obec + type concatenated),
 * plus the whole-obec inclusions. This is what the C-7 serializers consume.
 */
export interface MigrationExport {
  obvody: MigSkolskyObvod[];
  okrsky: MigSkolskyOkrsek[];
  skoKo: MigSkoKo[];
  defBody: MigDefBodKo[];
  hrany: MigHranKo[];
  skolaSko: MigSkolaSko[];
  vymezeni: MigVymezeniZbylychKo[];
}
