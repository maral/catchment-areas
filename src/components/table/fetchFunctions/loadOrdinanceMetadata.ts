import { Founder } from "@/entities/Founder";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { remult } from "remult";

const ordinancesMetadataRepo = remult.repo(OrdinanceMetadata);

export async function loadOrdinanceMetadata(
  founder: Founder,
  page: number,
  limit: number
): Promise<OrdinanceMetadata[]> {
  return await ordinancesMetadataRepo.find({
    where: { $or: [{ city: founder.name }, { city: founder.shortName }] },
    limit,
    page,
    orderBy: { validFrom: "asc" },
  });
}

export function serializeOrdinancesMetadata(
  ordinancesMetadata: OrdinanceMetadata[]
): any[] {
  return ordinancesMetadataRepo.toJson(ordinancesMetadata);
}

export function deserializeOrdinancesMetadata(
  ordinancesMetadata: any[]
): OrdinanceMetadata[] {
  return ordinancesMetadataRepo.fromJson(ordinancesMetadata);
}

export async function getOrdinanceMetadataCount(
  founder: Founder,
): Promise<number> {
  return await ordinancesMetadataRepo.count({
    $or: [{ city: founder.name }, { city: founder.shortName }],
  });
}
