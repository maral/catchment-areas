import { Region } from "@/entities/Region";
import { remult } from "remult";

const regionsRepo = remult.repo(Region);

export async function loadRegions(): Promise<Region[]> {
  return await regionsRepo.find({
    orderBy: { shortName: "asc" },
  });
}

export function serializeRegions(regions: Region[]): any[] {
  return regionsRepo.toJson(regions);
}

export function deserializeRegions(regions: any[]): Region[] {
  return regionsRepo.fromJson(regions);
}
