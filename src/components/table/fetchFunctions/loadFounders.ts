import { Founder } from "@/entities/Founder";
import { remult } from "remult";

const foundersRepo = remult.repo(Founder);

// FOUNDERS
export async function loadFounders(
  page: number,
  limit: number
): Promise<Founder[]> {
  return await foundersRepo.find({
    limit,
    page,
    orderBy: { shortName: "asc" },
    load: (f) => [f.city!],
  });
}

export async function getFoundersCount(): Promise<number> {
  return await foundersRepo.count();
}

// FOUNDERS BY REGION
export async function loadFoundersByRegion(
  regionCode: string,
  page: number,
  limit: number
): Promise<Founder[]> {
  return await foundersRepo.find({
    limit,
    page,
    where: Founder.filterByRegion({ regionCode }),
    orderBy: { shortName: "asc" },
    load: (f) => [f.city!],
  });
}

export async function getFoundersCountByRegion(
  regionCode: string
): Promise<number> {
  return await foundersRepo.count(Founder.filterByRegion({ regionCode }));
}

// FOUNDERS BY COUNTY
export async function loadFoundersByCounty(
  countyCode: string,
  page: number,
  limit: number
): Promise<Founder[]> {
  return await foundersRepo.find({
    limit,
    page,
    where: Founder.filterByCounty({ countyCode }),
    orderBy: { shortName: "asc" },
    load: (f) => [f.city!],
  });
}

export async function getFoundersCountByCounty(countyCode: string): Promise<number> {
  return await foundersRepo.count(Founder.filterByCounty({ countyCode }));
}

// FOUNDERS BY ORP
export async function loadFoundersByOrp(
  orpCode: string,
  page: number,
  limit: number
): Promise<Founder[]> {
  return await foundersRepo.find({
    limit,
    page,
    where: Founder.filterByOrp({ orpCode }),
    orderBy: { shortName: "asc" },
    load: (f) => [f.city!],
  });
}

export async function getFoundersCountByOrp(orpCode: string): Promise<number> {
  return await foundersRepo.count(Founder.filterByOrp({ orpCode }));
}

// TRANSFORM DATA
export function serializeFounders(founders: Founder[]): any[] {
  return foundersRepo.toJson(founders);
}

export function deserializeFounders(founders: any[]): Founder[] {
  return foundersRepo.fromJson(founders);
}
