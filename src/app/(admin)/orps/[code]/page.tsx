import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import {
  getCitiesCountByOrp,
  loadCitiesByOrp,
  serializeCities,
} from "@/components/table/fetchFunctions/loadCities";
import OrpCitiesTable from "@/components/table/tableWrappers/citiesTableWrappers/OrpCitiesTable";
import { Orp } from "@/entities/Orp";
import { Card } from "@tremor/react";
import { remult } from "remult";
import { CityController } from "@/controllers/CityController";

export default async function OrpPage({
  params: { code },
}: {
  params: { code: string };
}) {
  const orpCode = Number(code);
  const { serializedCities, ordinances, count, orp } = await api.withRemult(
    async () => {
      const orp = await remult.repo(Orp).findId(orpCode);
      const cities = await loadCitiesByOrp(orpCode, 1, 50);
      const cityCodes = cities.map((city) => city.code);
      const ordinances = await CityController.loadActiveOrdinancesByCityCodes(
        cityCodes
      );
      return {
        orp,
        ordinances,
        serializedCities: serializeCities(cities),
        count: await getCitiesCountByOrp(orpCode),
      };
    }
  );

  return (
    <Card>
      <HeaderBox title={orp?.name} />
      <OrpCitiesTable
        orpCode={orpCode}
        initialData={serializedCities}
        simpleOrdinances={ordinances}
        count={count}
      />
    </Card>
  );
}
