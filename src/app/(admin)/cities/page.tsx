import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import {
  getCitiesCount,
  loadCities,
  serializeCities,
} from "@/components/table/fetchFunctions/loadCities";
import CitiesTable from "@/components/table/tableWrappers/citiesTableWrappers/CitiesTable";
import { texts } from "@/utils/shared/texts";
import { Card } from "@tremor/react";

export default async function Cities() {
  const { serializedCities, count } = await api.withRemult(async () => {
    return {
      serializedCities: serializeCities(await loadCities(1, 50)),
      count: await getCitiesCount(),
    };
  });

  return (
    <Card>
      <HeaderBox title={texts.cities} />
      <CitiesTable initialData={serializedCities} count={count} />
    </Card>
  );
}
