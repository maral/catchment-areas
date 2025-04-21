import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import RegionSelect from "@/components/RegionSelect";
import {
  loadCities,
  serializeCities,
} from "@/components/table/fetchFunctions/loadCities";
import {
  loadNewOrdinanceMetadata,
  serializeOrdinanceMetadata,
} from "@/components/table/fetchFunctions/loadOrdinanceMetadata";
import {
  loadRegions,
  serializeRegions,
} from "@/components/table/fetchFunctions/loadRegions";
import CitiesTable from "@/components/table/tableWrappers/citiesTableWrappers/CitiesTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getSchoolTypeCode } from "@/entities/School";
import { SchoolType } from "@/types/basicTypes";
import { texts } from "@/utils/shared/texts";
import { NewspaperIcon } from "@heroicons/react/24/outline";

export default async function Cities({
  params: { schoolType },
  searchParams,
}: {
  params: { schoolType: string };
  searchParams: { [key: string]: string | undefined };
}) {
  const schoolTypeCode = getSchoolTypeCode(schoolType);
  const selectedRegion = searchParams.region || "all";

  const {
    serializedCities,
    regions,
    newOrdinanceMetadata,
    serializedNewOrdinanceMetadata,
  } = await api.withRemult(async () => {
    const newOrdinanceMetadata = await loadNewOrdinanceMetadata(schoolTypeCode);
    const regionCode =
      selectedRegion === "all" ? undefined : Number(selectedRegion);
    return {
      serializedCities: serializeCities(
        await loadCities(schoolTypeCode, regionCode)
      ),
      regions: serializeRegions(await loadRegions()),
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
      <CardHeader>
        <HeaderBox title={pageTitle}>
          <RegionSelect regions={regions} selectedRegion={selectedRegion} />
        </HeaderBox>
      </CardHeader>
      <CardContent>
        {newOrdinanceMetadata.length > 0 && (
          <Alert className="mb-4" variant="warning">
            <NewspaperIcon className="h-4 w-4 mr-2" />
            <AlertTitle>{texts.newOrdinances}</AlertTitle>
            <AlertDescription>
              {texts.newOrdinancesAvailable(newOrdinanceMetadata.length)}
            </AlertDescription>
          </Alert>
        )}
        <CitiesTable
          initialData={serializedCities}
          newOrdinanceMetadata={serializedNewOrdinanceMetadata}
          schoolType={schoolTypeCode}
        />
      </CardContent>
    </Card>
  );
}
