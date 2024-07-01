import { api } from "@/app/api/[...remult]/api";
import { City } from "@/entities/City";
import { Founder } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown } from "@/entities/StreetMarkdown";
import { DataForMap, DataForMapByCityCodes } from "@/types/mapTypes";
import { remult } from "remult";
import {
  ErrorCallbackParams,
  Municipality,
  getNewMunicipalityByFounderId,
  municipalityToPolygons,
  parseOrdinanceToAddressPoints,
} from "text-to-map";
import { TextToMapError } from "../shared/types";
import { SchoolFounder } from "../../entities/SchoolFounder";
import { FounderController } from "../../controllers/FounderController";

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
  ordinance: Ordinance,
  text: string
): Promise<Municipality[] | null> {
  const currentMunicipality = await getNewMunicipalityByFounderId(
    ordinance.founder.id
  );

  if (currentMunicipality.errors.length > 0) {
    console.log(
      `Could not find municipality's founder with ID = '${ordinance.founder.id}'.`
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

export async function getOrCreateDataForMapByFounderId(
  founderId: number,
  ordinanceId?: number
): Promise<DataForMap | null> {
  const founder = await api.withRemult(async () => {
    return await remult.repo(Founder).findId(founderId);
  });

  if (!founder) {
    console.log(`Could not find founder with ID = '${founderId}'.`);
    return null;
  }

  return await getOrCreateDataForMap(founder, ordinanceId);
}

export async function getOrCreateDataForMapByCityCodes(
  cityCodes: number[],
  ordinanceId?: number
): Promise<DataForMapByCityCodes | null> {
  const founders = await api.withRemult(async () => {
    const cities = await remult.repo(City).find({
      where: { code: { $in: cityCodes.map((code) => Number(code)) } },
    });
    return await remult.repo(Founder).find({
      where: { city: { $in: cities } },
      load: (f) => [f.city!],
    });
  });

  if (!founders || founders.length === 0) {
    return {};
  }

  const municipalitiesByCityCodes: DataForMapByCityCodes = {};

  for (const founder of founders) {
    const data = await getOrCreateDataForMap(founder, ordinanceId);
    if (data) {
      if (founder.city.code in municipalitiesByCityCodes) {
        municipalitiesByCityCodes[founder.city.code].municipalities.push(
          ...data.municipalities
        );
        municipalitiesByCityCodes[founder.city.code].polygons.push(
          ...data.polygons
        );
      } else {
        municipalitiesByCityCodes[founder.city.code] = data;
      }
    }
  }

  return municipalitiesByCityCodes;
}

export async function getOrCreateDataForMapBySchoolIzo(
  schoolIzo: string
): Promise<DataForMap | null> {
  const founder = await api.withRemult(async () => {
    const founderId = await FounderController.findFounderIdBySchoolIzo(
      schoolIzo
    );

    if (founderId) {
      return await remult.repo(Founder).findFirst({ id: founderId });
    }
  });

  if (!founder) {
    return null;
  }

  const founderData = await getOrCreateDataForMap(founder);
  if (!founderData) {
    return null;
  }

  const municipality = founderData.municipalities.find((municipality) =>
    municipality.schools.some((school) => school.izo === schoolIzo)
  );
  if (!municipality) {
    return null;
  }

  const school = municipality.schools.find(
    (school) => school.izo === schoolIzo
  );
  municipality.schools = [school!];

  const collection = founderData.polygons.find((collection) =>
    collection.features.some(
      (feature) => feature.properties?.schoolIzo === schoolIzo
    )
  );

  if (!collection) {
    return null;
  }

  collection.features = collection.features.filter(
    (feature) => feature.properties?.schoolIzo === schoolIzo
  );

  return { municipalities: [municipality], polygons: [collection] };
}

export async function getStreetMarkdownSourceText(
  founderId: number,
  ordinanceId?: number
): Promise<string | null> {
  return await api.withRemult(async () => {
    const founder = await remult.repo(Founder).findId(founderId);
    if (!founder) {
      return null;
    }
    const ordinance = await _getOrdinance(founder, ordinanceId);
    if (!ordinance) {
      return null;
    }
    const streetMarkdown = await remult
      .repo(StreetMarkdown)
      .findFirst({ ordinance }, { orderBy: { id: "desc" } });
    return streetMarkdown.sourceText ?? null;
  });
}

async function _getOrdinance(
  founder: Founder,
  ordinanceId?: number
): Promise<Ordinance | null> {
  if (ordinanceId) {
    return await remult.repo(Ordinance).findId(ordinanceId);
  } else {
    return await remult
      .repo(Ordinance)
      .findFirst({ founder }, { where: { isActive: true } });
  }
}

export async function getOrCreateDataForMap(
  founder: Founder,
  ordinanceId?: number
): Promise<DataForMap | null> {
  return await api.withRemult(async () => {
    const ordinance = await _getOrdinance(founder, ordinanceId);
    if (!ordinance) {
      console.log(`Could not find ordinance with ID = '${ordinanceId}'.`);
      return null;
    }

    let municipalities = ordinance.jsonData;
    let polygons = ordinance.polygons;
    // get municipalities JSON or parse latest street markdown
    if (!municipalities || municipalities.length === 0) {
      const streetMarkdown = await remult
        .repo(StreetMarkdown)
        .findFirst({ ordinance }, { orderBy: { id: "desc" } });
      municipalities = await parseStreetMarkdown(
        ordinance,
        streetMarkdown.sourceText
      );
      if (!municipalities || municipalities.length === 0) {
        console.log(
          `No municipalities found for founder.id = '${founder.id}' and ordinance.id = '${ordinance.id}'.`
        );
        return null;
      }

      await remult.repo(Ordinance).update(ordinance.id, {
        ...ordinance,
        jsonData: municipalities,
      });
    }

    if (!polygons) {
      polygons = [];
      for (const municipality of municipalities) {
        polygons.push(await municipalityToPolygons(municipality));
      }
      if (!polygons || polygons.length === 0) {
        console.log(
          `Could not retrieve any polygons for founder.id = '${ordinanceId}' and ordinance.id = '${ordinance.id}'.`
        );
        return null;
      }

      await remult.repo(Ordinance).update(ordinance.id, {
        ...ordinance,
        jsonData: municipalities,
        polygons,
      });
    }

    return { municipalities, polygons };
  });
}
