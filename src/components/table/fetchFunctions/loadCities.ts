import { City } from "@/entities/City";
import { Region } from "@/entities/Region";
import { remult } from "remult";
import { County } from "../../../entities/County";
import { Orp } from "../../../entities/Orp";

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

// CITIES BY COUNTY
export async function loadCitiesByCounty(
  countyCode: number,
  page: number,
  limit: number
): Promise<City[]> {
  const county = await remult.repo(County).findId(countyCode);
  return await citiesRepo.find({
    limit,
    page,
    where: { county },
    orderBy: { name: "asc" },
  });
}

export async function getCitiesCountByCounty(
  countyCode: number
): Promise<number> {
  const county = await remult.repo(County).findId(countyCode);
  return await citiesRepo.count({ county });
}

// CITIES BY ORP
export async function loadCitiesByOrp(
  orpCode: number,
  page: number,
  limit: number
): Promise<City[]> {
  const orp = await remult.repo(Orp).findId(orpCode);
  return await citiesRepo.find({
    limit,
    page,
    where: { orp },
    orderBy: { name: "asc" },
  });
}

export async function getCitiesCountByOrp(orpCode: number): Promise<number> {
  const orp = await remult.repo(Orp).findId(orpCode);
  return await citiesRepo.count({ orp });
}

// TRANSFORM DATA
export function serializeCities(cities: City[]): any[] {
  return citiesRepo.toJson(cities);
}

export function deserializeCities(cities: any[]): City[] {
  return citiesRepo.fromJson(cities);
}
