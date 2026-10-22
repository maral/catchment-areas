import { getAdminRemultAPI } from "@/app/api/[...remult]/config";
import { OrdinanceControllerServer } from "@/controllers/OrdinanceControllerServer";
import { StreetMarkdownControllerServer } from "@/controllers/StreetMarkdownControllerServer";
import { SchoolType } from "@/types/basicTypes";
import {
  getExternalMapDataPath,
  type ExternalMapData,
} from "@/utils/server/externalMapData";
import { getAddressPointsBySmdTexts } from "@/utils/server/textToMap";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { readFileSync, writeFileSync } from "fs";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { join } from "path";
import { KnexDataProvider } from "remult/remult-knex";
import { Area, ExportAddressPoint, Municipality } from "text-to-map";

/**
 * One-off conversion of catchment areas a city sent us as finished geodata
 * (polygons + schools, no address points) into our own map data, served by an
 * ordinance with `externalData` set to the source key (see
 * `externalMapData.ts`):
 *
 *   npm run convert-external-data -- <externalData>
 *
 * Polygons are a WGS84 GeoJSON FeatureCollection whose properties match ours
 * (`areaIndex`, `colorIndex`, `schoolIzos` as a JSON-encoded string array);
 * schools are an Esri JSON point layer with `index_oblasti`, `IZO`,
 * `název_školy` and `adresa` attributes. The address points are ours, parsed
 * from the city's active regular ordinance, see `attachOurAddresses`.
 */
interface ExternalSource {
  cityCode: number;
  cityName: string;
  files: Partial<Record<SchoolType, { polygons: string; schools: string }>>;
}

const externalSources: Record<string, ExternalSource> = {
  ostrava: {
    cityCode: 554821,
    cityName: "Ostrava",
    files: {
      [SchoolType.Elementary]: {
        polygons: "spadovostZS_aktual.geojson",
        schools: "adresnimostrava_ZS.json",
      },
      [SchoolType.Kindergarten]: {
        polygons: "spadovostMS_aktual.geojson",
        schools: "adresnimostrava_MS.json",
      },
    },
  },
};

interface EsriSchoolFeature {
  attributes: {
    index_oblasti: number;
    IZO: string;
    název_školy: string;
    adresa: string;
  };
  geometry: { x: number; y: number };
}

const main = async () => {
  const externalData = process.argv[2];
  const source = externalSources[externalData];
  if (!source) {
    console.error(
      `Usage: convert-external-data <${Object.keys(externalSources).join("|")}>`
    );
    process.exit(1);
  }

  const api = getAdminRemultAPI();
  await api.withRemult(async () => {
    for (const [type, files] of Object.entries(source.files)) {
      const schoolType = Number(type) as SchoolType;
      const [active] =
        await OrdinanceControllerServer.getActiveOrdinanceIdsByCityCodes(
          [source.cityCode],
          schoolType
        );
      if (!active) {
        throw new Error(`${SchoolType[schoolType]}: no active ordinance.`);
      }
      const smdTexts =
        await StreetMarkdownControllerServer.getStreetMarkdownTexts(
          source.cityCode,
          active.ordinanceId
        );
      const ourMunicipalities = await getAddressPointsBySmdTexts(
        smdTexts,
        schoolType
      );
      if (ourMunicipalities === null) {
        throw new Error(`${SchoolType[schoolType]}: could not parse.`);
      }

      const dir = join(process.cwd(), "external-data", externalData);
      const mapData = convert(
        source,
        readFileSync(join(dir, files.polygons), "utf8"),
        readFileSync(join(dir, files.schools), "utf8"),
        ourMunicipalities
      );
      const path = getExternalMapDataPath(externalData, schoolType);
      writeFileSync(path, JSON.stringify(mapData));

      const [municipality] = mapData.jsonData;
      const points = municipality.areas.reduce(
        (sum, area) => sum + area.addresses.length,
        0
      );
      console.log(
        `${SchoolType[schoolType]}: ${municipality.areas.length} areas, ${points} address points (from ordinance ${active.ordinanceId}), ${municipality.unmappedPoints.length} unmapped -> ${path}`
      );
    }

    await KnexDataProvider.getDb().destroy();
  });
};

const convert = (
  source: ExternalSource,
  polygonsJson: string,
  schoolsJson: string,
  ourMunicipalities: Municipality[]
): ExternalMapData => {
  const polygons: FeatureCollection<Polygon | MultiPolygon> =
    JSON.parse(polygonsJson);
  // keep only the properties of our own polygons
  polygons.features.forEach((feature) => {
    const { OBJECTID, areaIndex, colorIndex, schoolIzos } =
      feature.properties ?? {};
    try {
      feature.properties = {
        areaIndex,
        colorIndex,
        schoolIzos: JSON.parse(schoolIzos),
      };
    } catch {
      throw new Error(
        `Polygon OBJECTID ${OBJECTID} has invalid schoolIzos ${schoolIzos}`
      );
    }
  });

  const schoolFeatures: EsriSchoolFeature[] = JSON.parse(schoolsJson).features;
  const areasByIndex: Record<number, Area> = {};
  schoolFeatures.forEach(({ attributes, geometry }) => {
    const index = attributes.index_oblasti;
    areasByIndex[index] ??= { index, schools: [], addresses: [] };
    areasByIndex[index].schools.push({
      name: attributes.název_školy,
      izo: attributes.IZO,
      position: {
        address: attributes.adresa,
        lat: geometry.y,
        lng: geometry.x,
      },
    });
  });

  const municipality: Municipality = {
    municipalityName: source.cityName,
    code: source.cityCode,
    municipalityType: "city",
    cityCodes: [source.cityCode],
    districtCodes: [],
    areas: Object.values(areasByIndex).sort((a, b) => a.index - b.index),
    unmappedPoints: [],
  };
  attachOurAddresses(municipality, polygons, ourMunicipalities);

  return { jsonData: [municipality], polygons: [polygons] };
};

/**
 * The city's data carries no address points, so ours (parsed from the
 * ordinance) are attached to its areas: each of our areas goes to the
 * smallest city area containing all of our schools that the city lists at all
 * (a school can be in several areas), whole villages it absorbs included.
 * The city's polygons then decide where points actually belong: a point lying
 * outside its area's polygon moves to the polygons it lies in, and points
 * still unmapped (our unmapped points, areas with no such single area) go to
 * them too. Points outside every polygon keep their area, or stay unmapped.
 */
const attachOurAddresses = (
  municipality: Municipality,
  polygons: FeatureCollection<Polygon | MultiPolygon>,
  ourMunicipalities: Municipality[]
) => {
  const listedIzos = new Set(
    municipality.areas.flatMap((area) => area.schools.map((s) => s.izo))
  );

  const findArea = (ourArea: Area): Area | null => {
    const izos = ourArea.schools
      .map((school) => school.izo)
      .filter((izo) => listedIzos.has(izo));
    if (izos.length === 0) {
      return null;
    }
    const candidates = municipality.areas
      .filter((area) =>
        izos.every((izo) => area.schools.some((school) => school.izo === izo))
      )
      .sort((a, b) => a.schools.length - b.schools.length);
    if (
      candidates.length === 0 ||
      candidates[1]?.schools.length === candidates[0].schools.length
    ) {
      return null;
    }
    return candidates[0];
  };

  const unmappedPoints: ExportAddressPoint[] = [];
  ourMunicipalities.forEach((ourMunicipality) => {
    ourMunicipality.areas.forEach((ourArea) => {
      const area = findArea(ourArea);
      if (area) {
        area.addresses.push(...ourArea.addresses);
        if (ourArea.absorbedWholeObce?.length) {
          area.absorbedWholeObce = Array.from(
            new Set([
              ...(area.absorbedWholeObce ?? []),
              ...ourArea.absorbedWholeObce,
            ])
          );
        }
      } else {
        unmappedPoints.push(...ourArea.addresses);
      }
    });
    unmappedPoints.push(...ourMunicipality.unmappedPoints);
  });

  const areasByIndex = Object.fromEntries(
    municipality.areas.map((area) => [area.index, area])
  );
  const polygonsWithBbox = polygons.features.map((feature) => ({
    feature,
    bbox: getBbox(feature.geometry),
    area: areasByIndex[feature.properties?.areaIndex],
  }));
  const getContainingAreas = (point: ExportAddressPoint): Area[] =>
    polygonsWithBbox
      .filter(
        ({ feature, bbox: [minLng, minLat, maxLng, maxLat], area }) =>
          area &&
          point.lng >= minLng &&
          point.lng <= maxLng &&
          point.lat >= minLat &&
          point.lat <= maxLat &&
          booleanPointInPolygon([point.lng, point.lat], feature)
      )
      .map(({ area }) => area);

  // the city's borders win: a point lying in other polygons than its area's
  // moves there
  municipality.areas.forEach((area) => {
    const addresses = area.addresses;
    area.addresses = [];
    addresses.forEach((point) => {
      const containing = getContainingAreas(point);
      if (containing.length === 0 || containing.includes(area)) {
        area.addresses.push(point);
      } else {
        containing.forEach((other) => other.addresses.push(point));
      }
    });
  });

  const mappedAddresses = new Set(
    municipality.areas.flatMap((area) => area.addresses.map((p) => p.address))
  );
  unmappedPoints.forEach((point) => {
    if (mappedAddresses.has(point.address)) {
      return;
    }
    mappedAddresses.add(point.address);

    const containing = getContainingAreas(point);
    if (containing.length === 0) {
      municipality.unmappedPoints.push(point);
    }
    containing.forEach((area) => area.addresses.push(point));
  });

  // several of our areas can land in the same one
  municipality.areas.forEach((area) => {
    const seen = new Set<string>();
    area.addresses = area.addresses.filter(
      (point) => !seen.has(point.address) && Boolean(seen.add(point.address))
    );
  });
};

const getBbox = (geometry: Polygon | MultiPolygon) => {
  const rings =
    geometry.type === "Polygon"
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((p) => p[0]);
  const lngs = rings.flat().map(([lng]) => lng);
  const lats = rings.flat().map(([, lat]) => lat);
  return [
    Math.min(...lngs),
    Math.min(...lats),
    Math.max(...lngs),
    Math.max(...lats),
  ];
};

main();
