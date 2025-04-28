import { api } from "@/app/api/[...remult]/api";
import { OrdinanceController } from "@/controllers/OrdinanceController";
import { City } from "@/entities/City";
import { Ordinance } from "@/entities/Ordinance";
import { SchoolType } from "@/types/basicTypes";
import { revalidatePath } from "next/cache";
import { remult } from "remult";
import { routes } from "../shared/constants";
import { TextExtractionResult } from "../shared/types";
import { Founder } from "@/entities/Founder";

async function insertOrdinance(
  cityCode: number,
  validFrom: Date,
  validTo: Date | undefined,
  serialNumber: string,
  result: TextExtractionResult,
  schoolType: SchoolType
): Promise<number | null> {
  if (!result.fileName) {
    return null;
  }

  const ordinance = await api.withRemult(async () => {
    const isActive = !validTo || validTo > new Date();
    const city = await remult.repo(City).findId(cityCode);
    return remult.repo(Ordinance).insert({
      number: serialNumber,
      originalText: result.text ?? "",
      validFrom: validFrom,
      validTo: validTo,
      fileName: result.fileName ?? "",
      isActive,
      city,
      schoolType,
    });
  });

  if (!ordinance) {
    return null;
  }

  return ordinance.id;
}

export interface AddOrdinanceResponse {
  success: boolean;
  ordinanceId?: number;
}

export async function insertOrdinanceAndGetResponse(
  cityCode: number,
  validFrom: Date,
  validTo: Date | undefined,
  serialNumber: string,
  result: TextExtractionResult,
  schoolType: SchoolType,
  redirectRootUrl: string
): Promise<AddOrdinanceResponse> {
  const ordinanceId = await insertOrdinance(
    cityCode,
    validFrom,
    validTo,
    serialNumber,
    result,
    schoolType
  );

  if (ordinanceId) {
    const founders = await api.withRemult(async () => {
      await OrdinanceController.determineActiveOrdinanceByCityCode(
        Number(cityCode),
        schoolType
      );

      const city = await remult
        .repo(City)
        .findFirst({ code: Number(cityCode) });
      return await remult.repo(Founder).find({ where: { city } });
    });

    revalidatePath(`${redirectRootUrl}/[code]${routes.detail}`, "page");
    return {
      success: true,
      ...(result.text
        ? {}
        : {
            message: `Nepodporovaný formát ${result.fileType}, přidána vyhláška s prázdným původním textem.`,
          }),
      ordinanceId,
      ...(founders.length === 1 ? { founderId: founders[0].id } : {}),
    };
  } else {
    return {
      success: false,
    };
  }
}
