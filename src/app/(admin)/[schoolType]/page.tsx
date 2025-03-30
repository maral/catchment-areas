import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import {
  loadCities,
  serializeCities,
} from "@/components/table/fetchFunctions/loadCities";
import CitiesTable from "@/components/table/tableWrappers/citiesTableWrappers/CitiesTable";
import { getSchoolTypeCode } from "@/entities/School";
import { SchoolType } from "@/types/basicTypes";
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
    newOrdinanceMetadata,
    serializedNewOrdinanceMetadata,
  } = await api.withRemult(async () => {
    const newOrdinanceMetadata = await loadNewOrdinanceMetadata(schoolTypeCode);
    return {
      serializedCities: serializeCities(
        await loadCities(1, 1000, schoolTypeCode)
      ),
      newOrdinanceMetadata,
      serializedNewOrdinanceMetadata:
        serializeOrdinanceMetadata(newOrdinanceMetadata),
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
        schoolType={schoolTypeCode}
      />
    </Card>
  );
}
