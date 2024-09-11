import { api } from "@/app/api/[...remult]/api";
import { Ordinance } from "@/entities/Ordinance";
import { revalidatePath } from "next/cache";
import { remult } from "remult";
import { routes } from "../shared/constants";
import { TextExtractionResult } from "../shared/types";
import { City } from "@/entities/City";

async function insertOrdinance(
  cityCode: number,
  validFrom: Date,
  validTo: Date | undefined,
  serialNumber: string,
  result: TextExtractionResult
): Promise<number | null> {
  if (!result.text || !result.fileName) {
    return null;
  }

  const ordinanceRepo = remult.repo(Ordinance);
  const citiesRepo = remult.repo(City);

  const ordinance = await api.withRemult(async () => {
    const isActive = !validTo || validTo > new Date();
    const city = await citiesRepo.findId(cityCode);
    return ordinanceRepo.insert({
      number: serialNumber,
      originalText: result.text ?? undefined,
      validFrom: validFrom,
      validTo: validTo,
      fileName: result.fileName ?? "",
      isActive,
      city,
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
  result: TextExtractionResult
): Promise<AddOrdinanceResponse> {
  const ordinanceId = await insertOrdinance(
    cityCode,
    validFrom,
    validTo,
    serialNumber,
    result
  );

  if (ordinanceId) {
    revalidatePath(`${routes.cities}/[id]${routes.detail}/[[...from]]`, "page");
    return {
      success: true,
      ordinanceId,
    };
  } else {
    return {
      success: false,
    };
  }
}
