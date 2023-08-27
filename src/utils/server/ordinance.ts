import { api } from "@/app/api/[...remult]/api";
import { Founder } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { revalidatePath } from "next/cache";
import { remult } from "remult";
import { routes } from "../shared/constants";
import { TextExtractionResult } from "../shared/types";

async function insertOrdinance(
  founderId: number,
  validFrom: Date,
  validTo: Date | undefined,
  serialNumber: string,
  result: TextExtractionResult
): Promise<number | null> {
  if (!result.text || !result.fileName) {
    return null;
  }

  const ordinanceRepo = remult.repo(Ordinance);
  const founderRepo = remult.repo(Founder);

  const ordinance = await api.withRemult(async () => {
    const isActive = !validTo || validTo > new Date();
    const founder = await founderRepo.findId(founderId);
    return ordinanceRepo.insert({
      number: serialNumber,
      originalText: result.text ?? undefined,
      validFrom: validFrom,
      validTo: validTo,
      fileName: result.fileName ?? "",
      isActive,
      founder,
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
  founderId: number,
  validFrom: Date,
  validTo: Date | undefined,
  serialNumber: string,
  result: TextExtractionResult
): Promise<AddOrdinanceResponse> {
  const ordinanceId = await insertOrdinance(
    founderId,
    validFrom,
    validTo,
    serialNumber,
    result,
  );

  if (ordinanceId) {
    revalidatePath(`${routes.founders}/[id]${routes.detail}/[[...from]]`);
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
