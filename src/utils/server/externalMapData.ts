import { SchoolType } from "@/types/basicTypes";
import type { FeatureCollection } from "geojson";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { Municipality } from "text-to-map";

/**
 * Map data converted once from geodata a city sent us (see
 * `bin/convert-external-data.ts`), served by an ordinance with `externalData`
 * set to the key — the directory in `external-data/` — instead of map data
 * parsed from its street markdown.
 */
export interface ExternalMapData {
  jsonData: Municipality[];
  polygons: FeatureCollection[];
}

export const getExternalMapDataPath = (
  externalData: string,
  schoolType: SchoolType
): string => {
  if (!/^[a-z0-9-]+$/.test(externalData)) {
    throw new Error(`Invalid external data key '${externalData}'.`);
  }
  const type =
    schoolType === SchoolType.Elementary ? "elementary" : "kindergarten";
  return join(
    process.cwd(),
    "external-data",
    externalData,
    `map-data-${type}.json`
  );
};

export const hasExternalMapData = (
  externalData: string,
  schoolType: SchoolType
): boolean => existsSync(getExternalMapDataPath(externalData, schoolType));

export const loadExternalMapData = async (
  externalData: string,
  schoolType: SchoolType
): Promise<ExternalMapData> =>
  JSON.parse(
    await readFile(getExternalMapDataPath(externalData, schoolType), "utf8")
  );
