import { api } from "@/app/api/[...remult]/api";
import { Founder } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { StreetMarkdown } from "@/entities/StreetMarkdown";
import { remult } from "remult";
import {
  ErrorCallbackParams,
  Municipality,
  getNewMunicipality,
  parseOrdinanceToAddressPoints,
} from "text-to-map";
import { TextToMapError } from "../shared/types";
import { City } from "@/entities/City";
import { MunicipalitiesByCityCodes } from "@/types/mapTypes";

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
  const founder = await api.withRemult(async () => {
    return remult.repo(Founder).findId(founderId);
  });

  if (!founder) {
    return null;
  }

  const currentMunicipality = await getNewMunicipality(founder.shortName);

  if (currentMunicipality.errors.length > 0) {
    return null;
  }

  await parseOrdinanceToAddressPoints(
    lines,
    currentMunicipality.errors.length === 0
      ? { currentMunicipality: currentMunicipality.municipality }
      : {},
    onError,
    onWarning
  );

  return { errors: errorList, warnings: warningList };
}

export async function parseStreetMarkdown(
  ordinance: Ordinance,
  text: string
): Promise<Municipality[] | null> {
  const currentMunicipality = await getNewMunicipality(
    ordinance.founder.shortName
  );

  if (currentMunicipality.errors.length > 0) {
    return null;
  }

  return await parseOrdinanceToAddressPoints(text.split("\n"), {
    currentMunicipality: currentMunicipality.municipality,
  });
}

export async function getOrCreateMunicipalitiesByFounderId(
  founderId: number,
  ordinanceId?: number
): Promise<Municipality[] | null> {
  const founder = await api.withRemult(async () => {
    return await remult.repo(Founder).findId(founderId);
  });

  if (!founder) {
    return null;
  }

  return await getOrCreateMunicipalities(founder, ordinanceId);
}

export async function getOrCreateMunicipalitiesByCityCodes(
  cityCodes: number[],
  ordinanceId?: number
): Promise<MunicipalitiesByCityCodes | null> {
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

  const municipalitiesByCityCodes: MunicipalitiesByCityCodes = {};

  for (const founder of founders) {
    const municipalities = await getOrCreateMunicipalities(
      founder,
      ordinanceId
    );
    if (municipalities) {
      if (founder.city.code in municipalitiesByCityCodes) {
        municipalitiesByCityCodes[founder.city.code].push(...municipalities);
      } else {
        municipalitiesByCityCodes[founder.city.code] = municipalities;
      }
    }
  }

  return municipalitiesByCityCodes;
}

export async function getOrCreateMunicipalities(
  founder: Founder,
  ordinanceId?: number
): Promise<Municipality[] | null> {
  return await api.withRemult(async () => {
    let ordinance: Ordinance;

    if (ordinanceId) {
      ordinance = await remult.repo(Ordinance).findId(ordinanceId);
    } else {
      ordinance = await remult
        .repo(Ordinance)
        .findFirst({ founder }, { orderBy: { validFrom: "desc", id: "desc" } });
    }
    if (!ordinance) {
      return null;
    }

    // get municipalities JSON or parse latest street markdown
    if (!ordinance.jsonData) {
      const streetMarkdown = await remult
        .repo(StreetMarkdown)
        .findFirst({ ordinance }, { orderBy: { id: "desc" } });
      const municipalities = await parseStreetMarkdown(
        ordinance,
        streetMarkdown.sourceText
      );
      if (!municipalities) {
        return null;
      }

      await remult.repo(Ordinance).update(ordinance.id, {
        ...ordinance,
        jsonData: municipalities,
      });
      return municipalities;
    } else {
      return ordinance.jsonData;
    }
  });
}
