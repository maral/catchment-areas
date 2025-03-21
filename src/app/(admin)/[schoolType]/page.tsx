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
import { isSchoolType, SchoolTypeValues } from "@/entities/School";
import { notFound } from "next/navigation";
import { routes } from "@/utils/shared/constants";

export default async function Cities({
  params: { schoolType },
}: {
  params: { schoolType: string };
}) {
  const {
    serializedCities,
    count,
    newOrdinanceMetadata,
    serializedNewOrdinanceMetadata,
  } = await api.withRemult(async () => {
    const newOrdinanceMetadata = await loadNewOrdinanceMetadata(schoolType);
    return {
      serializedCities: serializeCities(await loadCities(1, 250)),
      newOrdinanceMetadata,
      serializedNewOrdinanceMetadata:
        serializeOrdinanceMetadata(newOrdinanceMetadata),
      count: await getCitiesCount(),
    };
  });

  const pageTitle =
    schoolType === SchoolTypeValues.kindergarten
      ? texts.schoolsKindergarten
      : texts.schoolsElementary;

  const rootPath = routes[schoolType as keyof typeof routes];

  return (
    <Card>
      <HeaderBox title={pageTitle} />
      {newOrdinanceMetadata.length > 0 && (
        <Callout color={"yellow"} title={texts.newOrdinances} className="mb-4">
          {texts.newOrdinancesAvailable(newOrdinanceMetadata.length)}
        </Callout>
      )}
      <CitiesTable
        initialData={serializedCities}
        newOrdinanceMetadata={serializedNewOrdinanceMetadata}
        count={count}
        schoolType={schoolType}
        rootPath={rootPath}
      />
    </Card>
  );
}
