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

export async function getOrCreateMunicipalities(
  founderId: number,
  ordinanceId?: number
): Promise<Municipality[] | null> {
  return await api.withRemult(async () => {
    const founder = await remult.repo(Founder).findId(founderId);
    if (!founder) {
      return null;
    }

    let ordinance: Ordinance;

    // get latest ordinance or specified ordinance
    if (ordinanceId) {
      ordinance = await remult.repo(Ordinance).findId(ordinanceId);
    } else {
      ordinance = await remult
        .repo(Ordinance)
        .findFirst({ founder }, { where: { isActive: true } });
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
