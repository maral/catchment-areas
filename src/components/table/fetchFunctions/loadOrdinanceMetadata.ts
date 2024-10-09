import { City } from "@/entities/City";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { remult } from "remult";

const ordinancesMetadataRepo = remult.repo(OrdinanceMetadata);

export async function loadOrdinanceMetadata(
  city: City,
  page: number,
  limit: number
): Promise<OrdinanceMetadata[]> {
  return await ordinancesMetadataRepo.find({
    where: { city: city.name.toLocaleLowerCase("cs") },
    limit,
    page,
    orderBy: { validFrom: "asc" },
  });
}

export async function loadNewOrdinanceMetadata(): Promise<OrdinanceMetadata[]> {
  return await ordinancesMetadataRepo.find({
    where: { isNewOrdinance: true },
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

export async function getOrdinanceMetadataCount(city: City): Promise<number> {
  return await ordinancesMetadataRepo.count({
    city: city.name.toLocaleLowerCase("cs"),
  });
}
