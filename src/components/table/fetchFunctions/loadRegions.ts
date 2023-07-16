import { Region } from "@/entities/Region";
import { remult } from "remult";

const regionsRepo = remult.repo(Region);

export async function loadRegions(page: number, limit: number): Promise<Region[]> {
  return await regionsRepo.find({
    limit,
    page,
    orderBy: { shortName: "asc" }
  });
}

export async function getRegionsCount(): Promise<number> {
  return await regionsRepo.count();
}

export function serializeRegions(regions: Region[]): any[] {
  return regionsRepo.toJson(regions);
}

export function deserializeRegions(regions: any[]): Region[] {
  return regionsRepo.fromJson(regions);
}
