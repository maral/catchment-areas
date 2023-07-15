import { Region } from "@/entities/Region";
import { remult } from "remult";

const foundersRepo = remult.repo(Region);

export async function loadRegions(page: number, limit: number): Promise<Region[]> {
  return await foundersRepo.find({
    limit,
    page,
    orderBy: { shortName: "asc" }
  });
}

export async function getRegionsCount(): Promise<number> {
  return await foundersRepo.count();
}

export function serializeRegions(regions: Region[]): any[] {
  return foundersRepo.toJson(regions);
}

export function deserializeRegions(regions: any[]): Region[] {
  return foundersRepo.fromJson(regions);
}
