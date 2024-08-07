import { api } from "@/app/api/[...remult]/api";
import { Founder, FounderStatus } from "@/entities/Founder";
import { CityOnMap } from "@/types/mapTypes";
import { remult } from "remult";

export async function getCitiesForMap(): Promise<CityOnMap[] | null> {
  return await api.withRemult(async () => {
    const founders = await remult.repo(Founder).find({
      load: (f) => [f.city!],
    });

    return Object.values(
      // reduce to unique cities
      founders.reduce((acc, founder) => {
        const city = founder.city;
        acc[city.code] = {
          code: city.code,
          name: city.name,
          isPublished:
            founder.status === FounderStatus.Published ||
            (acc[city.code] && acc[city.code].isPublished),
          lat: city.latitude,
          lng: city.longitude,
        };
        return acc;
      }, {} as Record<string, CityOnMap>)
    );
  });
}
