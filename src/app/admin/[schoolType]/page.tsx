import { api } from "@/app/api/[...remult]/api";
import HeaderBox from "@/components/common/HeaderBox";
import { ProgressSummary } from "@/components/ProgressSummary";
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
import { CitiesTable } from "@/components/table/tableWrappers/citiesTableWrappers/CitiesTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CityStatus, getStatusPropertyBySchoolType } from "@/entities/City";
import { getSchoolTypeCode } from "@/entities/School";
import { SchoolType } from "@/types/basicTypes";
import { calculateStatusCounts } from "@/utils/client/progress";
import { texts } from "@/utils/shared/texts";
import { NewspaperIcon } from "@heroicons/react/24/outline";

export default async function Cities(props: {
  params: Promise<{ schoolType: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const { schoolType } = params;

  const schoolTypeCode = getSchoolTypeCode(schoolType);
  const selectedRegion = searchParams.region || "all";

  const {
    cities,
    serializedCities,
    regions,
    newOrdinanceMetadata,
    serializedNewOrdinanceMetadata,
  } = await api.withRemult(async () => {
    const newOrdinanceMetadata = await loadNewOrdinanceMetadata(schoolTypeCode);
    const regionCode =
      selectedRegion === "all" ? undefined : Number(selectedRegion);
    const cities = await loadCities(schoolTypeCode, regionCode);
    return {
      cities,
      serializedCities: serializeCities(cities),
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

  const summaryCount = cities.filter(
    (city) =>
      city[getStatusPropertyBySchoolType(schoolTypeCode)] !==
      CityStatus.NoExistingOrdinance
  ).length;

  return (
    <Card>
      <CardHeader>
        <HeaderBox title={pageTitle}>
          <RegionSelect regions={regions} selectedRegion={selectedRegion} />
        </HeaderBox>
      </CardHeader>
      <CardContent className="space-y-6">
        {newOrdinanceMetadata.length > 0 && (
          <Alert variant="warning">
            <NewspaperIcon className="h-4 w-4 mr-2" />
            <AlertTitle>{texts.newOrdinances}</AlertTitle>
            <AlertDescription>
              {texts.newOrdinancesAvailable(newOrdinanceMetadata.length)}
            </AlertDescription>
          </Alert>
        )}

        <ProgressSummary
          statusCounts={calculateStatusCounts(
            cities,
            schoolTypeCode,
            newOrdinanceMetadata
          )}
          totalProjects={summaryCount}
        />

        <CitiesTable
          initialData={serializedCities}
          newOrdinanceMetadata={serializedNewOrdinanceMetadata}
          schoolType={schoolTypeCode}
        />
      </CardContent>
    </Card>
  );
}
