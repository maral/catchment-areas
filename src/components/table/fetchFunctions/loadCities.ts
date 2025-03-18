import { City } from "@/entities/City";
import { Region } from "@/entities/Region";
import { remult } from "remult";

const citiesRepo = remult.repo(City);

// CITIES
export async function loadCities(page: number, limit: number): Promise<City[]> {
  return await citiesRepo.find({
    limit,
    page,
    orderBy: { name: "asc" },
  });
}

export async function getCitiesCount(): Promise<number> {
  return await citiesRepo.count();
}

// CITIES BY REGION
export async function loadCitiesByRegion(
  regionCode: number,
  page: number,
  limit: number
): Promise<City[]> {
  const region = await remult.repo(Region).findId(regionCode);
  return await citiesRepo.find({
    limit,
    page,
    where: { region },
    orderBy: { name: "asc" },
  });
}

export async function getCitiesCountByRegion(
  regionCode: number
): Promise<number> {
  const region = await remult.repo(Region).findId(regionCode);
  return await citiesRepo.count({ region });
}

// TRANSFORM DATA
export function serializeCities(cities: City[]): any[] {
  return citiesRepo.toJson(cities);
}

export function deserializeCities(cities: any[]): City[] {
  return citiesRepo.fromJson(cities);
}
