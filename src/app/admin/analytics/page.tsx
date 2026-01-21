import { api } from "@/app/api/[...remult]/api";
import AnalyticsActions from "@/components/analyticsData/AnalyticsActions";
import AnalyticsCityAccordion from "@/components/analyticsData/AnalyticsCityAccordion";
import AnalyticsFilter from "@/components/analyticsData/AnalyticsFilter";
import LetterPagination from "@/components/analyticsData/LetterPagination";
import HeaderBox from "@/components/common/HeaderBox";
import { loadAnalyticsCities } from "@/components/table/fetchFunctions/loadAnalyticsCities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { texts } from "@/utils/shared/texts";

export default async function Analytics(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const selectedSchoolType = searchParams.schoolType || "all";
  const selectedDataType = searchParams.dataType || "all";
  const selectedLetter = searchParams.letter;
  const hideEmpty = searchParams.hideEmpty !== "false";

  const schoolTypeCode =
    selectedSchoolType === "all" ? undefined : Number(selectedSchoolType);

  const dataTypeCode =
    selectedDataType === "all" ? undefined : Number(selectedDataType);

  const { data, count } = await api.withRemult(async () => {
    const data = await loadAnalyticsCities(
      schoolTypeCode,
      dataTypeCode,
      selectedLetter,
      hideEmpty
    );
    const count = data.reduce((sum, city) => sum + city.schoolCount, 0);
    return { data, count };
  });

  return (
    <Card>
      <CardHeader>
        <HeaderBox title={texts.analyticsLayers}>
          <AnalyticsActions />
        </HeaderBox>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <AnalyticsFilter
            selectedSchoolType={selectedSchoolType}
            count={count}
            selectedDataType={selectedDataType}
            hideEmpty={hideEmpty}
          />
        </div>

        <LetterPagination selectedLetter={selectedLetter} />

        <Table>
          <colgroup>
            <col span={1} style={{ width: "40%" }} />
            <col span={1} style={{ width: "20%" }} />
            <col span={1} style={{ width: "20%" }} />
            <col span={1} style={{ width: "20%" }} />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>
                {texts.city} ({texts.numberOfSchools()})
              </TableHead>
              <TableHead>{texts.population}</TableHead>
              <TableHead>{texts.isv}</TableHead>
              <TableHead>{texts.earlySchoolLeavers}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((cityEntry) => (
              <TableRow key={cityEntry.city.code}>
                <TableCell colSpan={4} className="p-0">
                  <AnalyticsCityAccordion cityEntry={cityEntry} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
