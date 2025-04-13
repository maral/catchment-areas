import { City } from "@/entities/City";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { SchoolType } from "@/types/basicTypes";
import { remult } from "remult";

const ordinancesMetadataRepo = remult.repo(OrdinanceMetadata);

export async function loadOrdinanceMetadata(
  city: City,
  page: number,
  limit: number,
  schoolType: SchoolType
): Promise<OrdinanceMetadata[]> {
  return await ordinancesMetadataRepo.find({
    where: {
      city: city.name.toLocaleLowerCase("cs"),
      schoolType,
    },
    limit,
    page,
    orderBy: { validFrom: "asc" },
  });
}

export async function loadNewOrdinanceMetadata(
  schoolType: SchoolType
): Promise<OrdinanceMetadata[]> {
  return await ordinancesMetadataRepo.find({
    where: { isNewOrdinance: true, schoolType },
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
