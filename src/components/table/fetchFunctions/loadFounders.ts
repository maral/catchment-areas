import { Founder } from "@/entities/Founder";
import { Region } from "@/entities/Region";
import { remult } from "remult";

const foundersRepo = remult.repo(Founder);

export async function loadFounders(page: number, limit: number): Promise<Founder[]> {
  return await foundersRepo.find({
    limit,
    page,
    orderBy: { shortName: "asc" },
    load: (f) => [f.city!]
  });
}

export async function getFoundersCount(): Promise<number> {
  return await foundersRepo.count();
}

// TODO: filter by region
export async function loadFoundersByRegion(regionCode: string, page: number, limit: number): Promise<Founder[]> {
  return await foundersRepo.find({
    limit,
    page,
    // where: { city: { region } },
    orderBy: { shortName: "asc" },
    load: (f) => [f.city!],
  });
}

// TODO: filter by region
export async function getFoundersCountByRegion(regionCode: string): Promise<number> {
  return await foundersRepo.count({
    // where: { city: { region } },
  });
}

export function serializeFounders(founders: Founder[]): any[] {
  return foundersRepo.toJson(founders);
}

export function deserializeFounders(founders: any[]): Founder[] {
  return foundersRepo.fromJson(founders);
}
