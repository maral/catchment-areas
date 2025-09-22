import { City, getCountPropertyBySchoolType } from "@/entities/City";
import { Region } from "@/entities/Region";
import { SchoolType } from "@/types/basicTypes";
import { remult } from "remult";
const citiesRepo = remult.repo(City);

// CITIES
export async function loadCities(
  schoolType?: SchoolType,
  regionCode?: number
): Promise<City[]> {
  return await citiesRepo.find({
    where: {
      ...(schoolType === undefined
        ? {
            $or: [
              { schoolCount: { $gte: 2 } },
              { kindergartenCount: { $gte: 2 } },
            ],
          }
        : {
            [getCountPropertyBySchoolType(schoolType)]: { $gte: 2 },
          }),
      ...(regionCode
        ? { region: await remult.repo(Region).findFirst({ code: regionCode }) }
        : {}),
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
