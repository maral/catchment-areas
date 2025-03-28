import { City } from "@/entities/City";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { remult } from "remult";
import { SchoolType } from "@/entities/School";

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

export async function getOrdinanceMetadataCount(
  city: City,
  schoolType: SchoolType
): Promise<number> {
  return await ordinancesMetadataRepo.count({
    city: city.name.toLocaleLowerCase("cs"),
    schoolType,
  });
}
