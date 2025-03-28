import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import {
  getCitiesCount,
  loadCities,
  serializeCities,
} from "@/components/table/fetchFunctions/loadCities";
import CitiesTable from "@/components/table/tableWrappers/citiesTableWrappers/CitiesTable";
import { SchoolType, getSchoolTypeCode } from "@/entities/School";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { Callout, Card } from "@tremor/react";
import {
  loadNewOrdinanceMetadata,
  serializeOrdinanceMetadata,
} from "../../../components/table/fetchFunctions/loadOrdinanceMetadata";

export default async function Cities({
  params: { schoolType },
}: {
  params: { schoolType: string };
}) {
  const schoolTypeCode = getSchoolTypeCode(schoolType);

  const {
    serializedCities,
    count,
    newOrdinanceMetadata,
    serializedNewOrdinanceMetadata,
  } = await api.withRemult(async () => {
    const newOrdinanceMetadata = await loadNewOrdinanceMetadata(schoolTypeCode);
    return {
      serializedCities: serializeCities(
        await loadCities(1, 250, schoolTypeCode)
      ),
      newOrdinanceMetadata,
      serializedNewOrdinanceMetadata:
        serializeOrdinanceMetadata(newOrdinanceMetadata),
      count: await getCitiesCount(),
    };
  });

  const pageTitle =
    schoolTypeCode === SchoolType.Kindergarten
      ? texts.schoolsKindergarten
      : texts.schoolsElementary;

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
        schoolType={schoolTypeCode}
      />
    </Card>
  );
}
