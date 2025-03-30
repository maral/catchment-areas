import { City, getCountPropertyBySchoolType } from "@/entities/City";
import { Region } from "@/entities/Region";
import { SchoolType } from "@/types/basicTypes";
import { remult } from "remult";
const citiesRepo = remult.repo(City);

// CITIES
export async function loadCities(
  page: number,
  limit: number,
  schoolType: SchoolType
): Promise<City[]> {
  return await citiesRepo.find({
    where: { [getCountPropertyBySchoolType(schoolType)]: { $gte: 2 } },
    limit,
    page,
    orderBy: { name: "asc" },
  });
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
    where: {
      region,
      [getCountPropertyBySchoolType(SchoolType.Elementary)]: { $gte: 2 },
    },
    orderBy: { name: "asc" },
  });
}

// TRANSFORM DATA
export function serializeCities(cities: City[]): any[] {
  return citiesRepo.toJson(cities);
}

export function deserializeCities(cities: any[]): City[] {
  return citiesRepo.fromJson(cities);
}
