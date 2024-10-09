import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import {
  getCitiesCount,
  loadCities,
  serializeCities,
} from "@/components/table/fetchFunctions/loadCities";
import CitiesTable from "@/components/table/tableWrappers/citiesTableWrappers/CitiesTable";
import { texts } from "@/utils/shared/texts";
import { Callout, Card } from "@tremor/react";
import {
  loadNewOrdinanceMetadata,
  serializeOrdinanceMetadata,
} from "../../../components/table/fetchFunctions/loadOrdinanceMetadata";

export default async function Cities() {
  const {
    serializedCities,
    count,
    newOrdinanceMetadata,
    serializedNewOrdinanceMetadata,
  } = await api.withRemult(async () => {
    const newOrdinanceMetadata = await loadNewOrdinanceMetadata();
    return {
      serializedCities: serializeCities(await loadCities(1, 250)),
      newOrdinanceMetadata,
      serializedNewOrdinanceMetadata:
        serializeOrdinanceMetadata(newOrdinanceMetadata),
      count: await getCitiesCount(),
    };
  });

  return (
    <Card>
      <HeaderBox title={texts.cities} />
      {newOrdinanceMetadata.length > 0 && (
        <Callout color={"yellow"} title={texts.newOrdinances} className="mb-4">
          {texts.newOrdinancesAvailable(newOrdinanceMetadata.length)}
        </Callout>
      )}
      <CitiesTable
        initialData={serializedCities}
        newOrdinanceMetadata={serializedNewOrdinanceMetadata}
        count={count}
      />
    </Card>
  );
}
