import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import {
  loadCitiesByRegion,
  getCitiesCountByRegion,
  serializeCities,
} from "@/components/table/fetchFunctions/loadCities";
import RegionCitiesTable from "@/components/table/tableWrappers/citiesTableWrappers/RegionCitiesTable";
import { Region } from "@/entities/Region";
import { Card } from "@tremor/react";
import { remult } from "remult";
import { CityController } from "@/controllers/CityController";
import { SchoolType } from "../../../../entities/School";

export default async function RegionDetailPage({
  params: { code },
}: {
  params: { code: string };
}) {
  const regionCode = Number(code);
  const { serializedCities, ordinances, count, region } = await api.withRemult(
    async () => {
      const region = await remult.repo(Region).findId(regionCode);
      const cities = await loadCitiesByRegion(regionCode, 1, 50);
      const cityCodes = cities.map((city) => city.code);
      const ordinances = await CityController.loadActiveOrdinancesByCityCodes(
        cityCodes,
        SchoolType.Elementary
      );
      return {
        region,
        ordinances,
        serializedCities: serializeCities(cities),
        count: await getCitiesCountByRegion(regionCode),
      };
    }
  );

  return (
    <Card>
      <HeaderBox title={region?.name} />
      <RegionCitiesTable
        regionCode={regionCode}
        initialData={serializedCities}
        simpleOrdinances={ordinances}
        count={count}
      />
    </Card>
  );
}
