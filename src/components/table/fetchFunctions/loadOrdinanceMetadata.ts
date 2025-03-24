import { City } from "@/entities/City";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { remult } from "remult";
import { getSchoolTypeCode } from "@/entities/School";

const ordinancesMetadataRepo = remult.repo(OrdinanceMetadata);

export async function loadOrdinanceMetadata(
  city: City,
  page: number,
  limit: number,
  type: string
): Promise<OrdinanceMetadata[]> {
  const schoolTypeCode = getSchoolTypeCode(type);

  return await ordinancesMetadataRepo.find({
    where: {
      city: city.name.toLocaleLowerCase("cs"),
      schoolType: schoolTypeCode,
    },
    limit,
    page,
    orderBy: { validFrom: "asc" },
  });
}

export async function loadNewOrdinanceMetadata(
  type: string
): Promise<OrdinanceMetadata[]> {
  const schoolTypeCode = getSchoolTypeCode(type);

  return await ordinancesMetadataRepo.find({
    where: { isNewOrdinance: true, schoolType: schoolTypeCode },
  });
}

export function serializeOrdinanceMetadata(
  ordinancesMetadata: OrdinanceMetadata[]
): any[] {
  return ordinancesMetadataRepo.toJson(ordinancesMetadata);
}

export function deserializeOrdinanceMetadata(
  ordinancesMetadata: any[]
): OrdinanceMetadata[] {
  return ordinancesMetadataRepo.fromJson(ordinancesMetadata);
}

export async function getOrdinanceMetadataCount(
  city: City,
  type: string
): Promise<number> {
  const schoolTypeCode = getSchoolTypeCode(type);

  return await ordinancesMetadataRepo.count({
    city: city.name.toLocaleLowerCase("cs"),
    schoolType: schoolTypeCode,
  });
}
