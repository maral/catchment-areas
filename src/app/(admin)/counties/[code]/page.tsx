import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import {
  getCitiesCountByCounty,
  loadCitiesByCounty,
  serializeCities,
} from "@/components/table/fetchFunctions/loadCities";
import CountyCitiesTable from "@/components/table/tableWrappers/citiesTableWrappers/CountyCitiesTable";
import { County } from "@/entities/County";
import { Card } from "@tremor/react";
import { remult } from "remult";
import { CityController } from "../../../../controllers/CityController";

export default async function CountyDetailPage({
  params: { code },
}: {
  params: { code: string };
}) {
  const countyCode = Number(code);
  const { serializedCities, ordinances, count, county } = await api.withRemult(
    async () => {
      const county = await remult.repo(County).findId(countyCode);
      const cities = await loadCitiesByCounty(countyCode, 1, 50);
      const cityCodes = cities.map((city) => city.code);
      const ordinances = await CityController.loadActiveOrdinancesByCityCodes(
        cityCodes
      );
      return {
        county,
        ordinances,
        serializedCities: serializeCities(cities),
        count: await getCitiesCountByCounty(countyCode),
      };
    }
  );

  return (
    <Card>
      <HeaderBox title={county?.name} />
      <CountyCitiesTable
        countyCode={countyCode}
        initialData={serializedCities}
        simpleOrdinances={ordinances}
        count={count}
      />
    </Card>
  );
}
