import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { remult } from "remult";

const ordinancesMetadataRepo = remult.repo(OrdinanceMetadata);

export async function loadOrdinanceMetadata(page: number, limit: number): Promise<OrdinanceMetadata[]> {
  return await ordinancesMetadataRepo.find({
    limit,
    page,
    orderBy: { validFrom: "asc" },
  });
}

export function serializeOrdinancesMetadata(ordinancesMetadata: OrdinanceMetadata[]): any[] {
  return ordinancesMetadataRepo.toJson(ordinancesMetadata);
}

export function deserializeOrdinancesMetadata(ordinancesMetadata: any[]): OrdinanceMetadata[] {
  return ordinancesMetadataRepo.fromJson(ordinancesMetadata);
}
