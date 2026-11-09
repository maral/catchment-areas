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
import { loadSchoolNameIssueCityCodes } from "@/components/table/fetchFunctions/loadSchoolNameIssues";
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
import {
  ExclamationTriangleIcon,
  NewspaperIcon,
} from "@heroicons/react/24/outline";

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
    schoolNameIssueCityCodes,
  } = await api.withRemult(async () => {
    const regionCode =
      selectedRegion === "all" ? undefined : Number(selectedRegion);
    const listedCities = await loadCities(schoolTypeCode, regionCode);
    // alerts and badges count only the cities listed here (a city with a
    // single school isn't, even when it has a new ordinance)
    const listed = new Set(listedCities.map((city) => city.code));
    const newOrdinanceMetadata = (
      await loadNewOrdinanceMetadata(schoolTypeCode)
    ).filter((row) => row.cityCode !== null && listed.has(row.cityCode));
    const schoolNameIssueCityCodes = (
      await loadSchoolNameIssueCityCodes(schoolTypeCode)
    ).filter((code) => listed.has(code));
    // cities needing attention first: a problem in the active ordinance, then
    // a new ordinance, then the rest — each group alphabetical as loaded
    const newOrdinanceCityCodes = new Set(
      newOrdinanceMetadata.map((row) => row.cityCode)
    );
    const rank = (city: { code: number }) =>
      schoolNameIssueCityCodes.includes(city.code)
        ? 0
        : newOrdinanceCityCodes.has(city.code)
        ? 1
        : 2;
    const cities = listedCities
      .map((city, i) => ({ city, i }))
      .sort((a, b) => rank(a.city) - rank(b.city) || a.i - b.i)
      .map(({ city }) => city);
    return {
      cities,
      serializedCities: serializeCities(cities),
      schoolNameIssueCityCodes,
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
        {schoolNameIssueCityCodes.length > 0 && (
          <Alert variant="destructive">
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            <AlertTitle>{texts.schoolNameIssues}</AlertTitle>
            <AlertDescription>
              {texts.schoolNameIssuesFound(schoolNameIssueCityCodes.length)}
            </AlertDescription>
          </Alert>
        )}

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
          schoolNameIssueCityCodes={schoolNameIssueCityCodes}
          schoolType={schoolTypeCode}
        />
      </CardContent>
    </Card>
  );
}
