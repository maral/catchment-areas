import { Founder, FounderType } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown } from "@/entities/StreetMarkdown";
import { DataForMap, DataForMapByCityCodes, SmdText } from "@/types/mapTypes";
import { remult } from "remult";
import {
  ErrorCallbackParams,
  Municipality,
  getNewMunicipalityByFounderId,
  municipalitiesToPolygons,
  parseOrdinanceToAddressPoints,
} from "text-to-map";
import { TextToMapError } from "../shared/types";
import { MapData } from "@/entities/MapData";
import { OrdinanceControllerServer } from "@/controllers/OrdinanceControllerServer";
import { StreetMarkdownControllerServer } from "@/controllers/StreetMarkdownControllerServer";

/*
Editor:
- opens SMD that is now bound to (a) ordinance_id and (b) founder_id
- founder_id decides the streets loaded -> Liberec can get whole city streets, while Vratislavice only city district streets
- when saved, save SMD as usual
- the city map should be calculated together - using string concatenation
- but do we want to revalidate the large cities on every district change?
*/

// functions we need

// getDataForMap
// - [x] for school -> via city code + filter
// - [x] by city codes -> via city code
// - [x] by city code
// - [ ] by founder id -> different thing

// validateStreetMarkdown -> by founder ID only

export async function validateStreetMarkdown(
  lines: string[],
  founderId: number
): Promise<{ errors: TextToMapError[]; warnings: TextToMapError[] } | null> {
  const errorList: TextToMapError[] = [];
  const warningList: TextToMapError[] = [];
  const onError = ({ line, lineNumber, errors }: ErrorCallbackParams) => {
    errors.forEach((error) => {
      errorList.push({ ...error, lineNumber, line });
    });
  };
  const onWarning = ({ line, lineNumber, errors }: ErrorCallbackParams) => {
    errors.forEach((error) => {
      warningList.push({ ...error, lineNumber, line });
    });
  };

  const currentMunicipality = await getNewMunicipalityByFounderId(founderId);

  if (currentMunicipality.errors.length > 0) {
    return null;
  }

  await parseOrdinanceToAddressPoints({
    lines,
    initialState:
      currentMunicipality.errors.length === 0
        ? { currentMunicipality: currentMunicipality.municipality }
        : {},
    onError,
    onWarning,
    includeUnmappedAddressPoints: false,
  });

  return { errors: errorList, warnings: warningList };
}

export async function parseStreetMarkdown(
  founderId: number,
  text: string
): Promise<Municipality[] | null> {
  const currentMunicipality = await getNewMunicipalityByFounderId(founderId);

  if (currentMunicipality.errors.length > 0) {
    console.log(
      `Could not find municipality's founder with ID = '${founderId}'.`
    );
    return null;
  }

  return await parseOrdinanceToAddressPoints({
    lines: text.split("\n"),
    initialState: {
      currentMunicipality: currentMunicipality.municipality,
    },
    includeUnmappedAddressPoints: true,
  });
}

export async function getOrCreateDataForMapByCityCodes(
  cityCodes: number[]
): Promise<DataForMapByCityCodes | null> {
  const ordinanceIds =
    await OrdinanceControllerServer.getActiveOrdinanceIdsByCityCodes(cityCodes);

  const municipalitiesByCityCodes: DataForMapByCityCodes = {};

  for (const { ordinanceId, cityCode } of ordinanceIds) {
    const data = await getOrCreateDataForMapByCityCode(cityCode, ordinanceId);
    if (data) {
      if (cityCode in municipalitiesByCityCodes) {
        municipalitiesByCityCodes[cityCode].municipalities.push(
          ...data.municipalities
        );
        municipalitiesByCityCodes[cityCode].polygons.push(...data.polygons);
      } else {
        municipalitiesByCityCodes[cityCode] = data;
      }
    }
  }

  return municipalitiesByCityCodes;
}

export async function getOrCreateDataForMapBySchoolIzo(
  schoolIzo: string
): Promise<DataForMap | null> {
  const activeOrdinance =
    await OrdinanceControllerServer.getActiveOrdinanceBySchoolIzo(schoolIzo);

  if (activeOrdinance === null) {
    return null;
  }
  const { cityCode, ordinanceId } = activeOrdinance;

  const data = await getOrCreateDataForMapByCityCode(cityCode, ordinanceId);

  if (data === null) {
    return null;
  }

  return filterSchoolData(data, schoolIzo);
}

export async function getOrCreateDataForMapByCityCode(
  cityCode: number,
  ordinanceId: number
): Promise<DataForMap | null> {
  let mapData = await remult.repo(MapData).findFirst({
    cityCode,
    ordinanceId,
  });

  const smdTexts = await StreetMarkdownControllerServer.getStreetMarkdownTexts(
    cityCode,
    ordinanceId
  );

  let jsonData = mapData?.jsonData ?? null;
  let polygons = mapData?.polygons ?? null;

  if (jsonData === null) {
    if (smdTexts.length === 0) {
      console.log(`No street markdowns found for city code = '${cityCode}'.`);
      return null;
    }
    jsonData = await getAddressPointsBySmdTexts(smdTexts);
    if (jsonData === null) {
      return null;
    }

    if (!mapData) {
      mapData = await remult.repo(MapData).insert({
        cityCode,
        ordinanceId,
      });
    }

    OrdinanceControllerServer.setJsonData(
      ordinanceId,
      jsonData,
      cityCode,
      undefined
    );
  }

  if (polygons === null) {
    polygons = Object.values(await municipalitiesToPolygons(jsonData));

    if (!polygons || polygons.length === 0) {
      console.log(
        `Could not retrieve any polygons for city_code = '${cityCode}' and ordinance_id = '${ordinanceId}'.`
      );

      await remult.repo(MapData).delete(mapData.id);
      return null;
    }
    OrdinanceControllerServer.setPolygons(
      ordinanceId,
      polygons,
      cityCode,
      undefined
    );
  }

  return { municipalities: jsonData, polygons, text: getSmdText(smdTexts) };
}

export async function getOrCreateDataForMapByFounderId(
  founderId: number,
  ordinanceId: number
): Promise<DataForMap | null> {
  const mapData = await remult.repo(MapData).findFirst({
    founderId,
    ordinanceId,
  });

  if (!mapData) {
    await remult.repo(MapData).insert({
      founderId,
      ordinanceId,
    });
  }

  const founder = await remult.repo(Founder).findId(founderId);

  if (!founder) {
    console.log(`Could not find founder with ID = '${founderId}'.`);
    return null;
  }

  const ordinance = await remult.repo(Ordinance).findId(ordinanceId);
  if (!ordinance) {
    console.log(`Could not find ordinance with ID = '${ordinanceId}'.`);
    return null;
  }

  let jsonData = mapData?.jsonData ?? null;
  let polygons = mapData?.polygons ?? null;

  const text = await getStreetMarkdownSourceText(founderId, ordinanceId);

  if (text === null) {
    console.log(
      `Could not retrieve street markdown text for founder with ID = '${founderId}' and ordinance with ID = '${ordinanceId}'.`
    );
    return null;
  }

  if (jsonData === null) {
    jsonData = await parseStreetMarkdown(founderId, text);
    if (jsonData === null) {
      return null;
    }

    OrdinanceControllerServer.setJsonData(
      ordinanceId,
      jsonData,
      undefined,
      founderId
    );
  }

  if (polygons === null) {
    polygons = Object.values(await municipalitiesToPolygons(jsonData));

    if (!polygons || polygons.length === 0) {
      return null;
    }
    OrdinanceControllerServer.setPolygons(
      ordinanceId,
      polygons,
      undefined,
      founderId
    );
  }

  return {
    municipalities: jsonData,
    polygons,
    text,
  };
}

async function filterSchoolData(
  data: DataForMap,
  schoolIzo: string
): Promise<DataForMap | null> {
  // filter municipalities
  const municipalities = data.municipalities
    .filter((municipality) =>
      municipality.areas.some((area) =>
        area.schools.some((school) => school.izo === schoolIzo)
      )
    )
    .map((municipality) => {
      municipality.areas = municipality.areas
        .filter((area) =>
          area.schools.some((school) => school.izo === schoolIzo)
        )
        .map((area) => {
          area.schools = area.schools.filter(
            (school) => school.izo === schoolIzo
          );
          return area;
        });
      return municipality;
    });

  if (municipalities.length === 0) {
    return null;
  }

  // filter polygons
  const collection = data.polygons.find((collection) =>
    collection.features.some((feature) =>
      feature.properties?.schoolIzos.includes(schoolIzo)
    )
  );

  if (!collection) {
    return null;
  }

  collection.features = collection.features.filter((feature) =>
    feature.properties?.schoolIzos.includes(schoolIzo)
  );

  return {
    municipalities,
    polygons: [collection],
    text: data.text,
  };
}

export async function getStreetMarkdownSourceText(
  founderId: number,
  ordinanceId: number
): Promise<string | null> {
  const streetMarkdown = await remult
    .repo(StreetMarkdown)
    .findFirst(
      { ordinance: { $id: ordinanceId }, founder: { $id: founderId } },
      { orderBy: { id: "desc" } }
    );
  return streetMarkdown.sourceText ?? null;
}

export function getSmdText(smdTexts: SmdText[]) {
  if (smdTexts.length === 0) {
    return "";
  }

  if (smdTexts.length === 1) {
    return smdTexts[0].sourceText;
  }

  return smdTexts
    .map((smd) => `# ${smd.founderName}\n\n${smd.sourceText}`)
    .join("\n\n");
}

async function getAddressPointsBySmdTexts(
  smdTexts: SmdText[]
): Promise<Municipality[] | null> {
  const text = getSmdText(smdTexts);

  const currentMunicipality =
    smdTexts.length === 1 && smdTexts[0].founderType === FounderType.City
      ? await getNewMunicipalityByFounderId(smdTexts[0].founderId)
      : undefined;

  return await parseOrdinanceToAddressPoints({
    lines: text.split("\n"),
    initialState: currentMunicipality
      ? {
          currentMunicipality: currentMunicipality.municipality,
        }
      : {},
    includeUnmappedAddressPoints: true,
  });
}
