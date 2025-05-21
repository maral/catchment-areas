import { api } from "@/app/api/[...remult]/api";
import { CityOnMap } from "@/types/mapTypes";
import { remult } from "remult";
import { City, CityStatus } from "../../entities/City";
import { SchoolType } from "@/types/basicTypes";
import { getStatusPropertyBySchoolType } from "@/entities/City";

export async function getCitiesForMap(
  schoolType: SchoolType
): Promise<CityOnMap[] | null> {
  return await api.withRemult(async () => {
    const cities = await remult.repo(City).find();

    return Object.values(
      // reduce to unique cities
      cities.reduce((acc, city) => {
        acc[city.code] = {
          code: city.code,
          name: city.name,
          isPublished:
            city[getStatusPropertyBySchoolType(schoolType)] ===
              CityStatus.Published ||
            (acc[city.code] && acc[city.code].isPublished),
          lat: city.latitude,
          lng: city.longitude,
        };
        return acc;
      }, {} as Record<string, CityOnMap>)
    );
  });
}
