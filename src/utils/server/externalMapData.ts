import { SchoolType } from "@/types/basicTypes";
import type { FeatureCollection } from "geojson";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { School } from "@/entities/School";
import { remult } from "remult";
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

/**
 * The converted map data, with each school's name as the registry has it now:
 * the conversion took the names from the city's file, which aren't kept up to
 * date (and a rename in a schools sync would never reach them).
 */
export const loadExternalMapData = async (
  externalData: string,
  schoolType: SchoolType
): Promise<ExternalMapData> => {
  const data: ExternalMapData = JSON.parse(
    await readFile(getExternalMapDataPath(externalData, schoolType), "utf8")
  );
  const schools = data.jsonData.flatMap((m) =>
    m.areas.flatMap((a) => a.schools)
  );
  const names = new Map(
    (
      await remult.repo(School).find({
        where: { izo: Array.from(new Set(schools.map((s) => s.izo))) },
      })
    ).map((s) => [s.izo, s.name])
  );
  for (const school of schools) {
    school.name = names.get(school.izo) ?? school.name;
  }
  return data;
};
