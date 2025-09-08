import { api } from "@/app/api/[...remult]/api";
import AnalyticsActions from "@/components/analyticsData/AnalyticsActions";
import HeaderBox from "@/components/common/HeaderBox";
import { loadAnalyticsData } from "@/components/table/fetchFunctions/loadAnalyticsData";
import { Card, CardContent, CardHeader } from "@/components/ui/card"; // Updated import
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AnalyticsFilter from "@/components/analyticsData/AnalyticsFilter";
import { SchoolType } from "@/types/basicTypes";
import { texts } from "@/utils/shared/texts";

export default async function Analytics(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const selectedSchoolType = searchParams.schoolType || "all";
  const selectedDataType = searchParams.dataType || "all";

  const schoolTypeCode =
    selectedSchoolType === "all" ? undefined : Number(selectedSchoolType);

  const dataTypeCode =
    selectedDataType === "all" ? undefined : Number(selectedDataType);

  const { data, count } = await api.withRemult(async () => {
    const data = await loadAnalyticsData(schoolTypeCode, dataTypeCode);
    return { data, count: data.length };
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
          />
        </div>

        <Table>
          <colgroup>
            <col span={1} style={{ width: "40%" }} />
            <col span={1} style={{ width: "10%" }} />
            <col span={1} style={{ width: "10%" }} />
            <col span={1} style={{ width: "10%" }} />
            <col span={1} style={{ width: "10%" }} />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>Škola</TableHead>
              <TableHead>Typ školy</TableHead>
              <TableHead>Studentů celkem</TableHead>
              <TableHead>Ukrajinských studentů</TableHead>
              <TableHead>Počet konzultací NPI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={`${item.school.izo}:${item.school.type}`}>
                <TableCell className="whitespace-break-spaces">
                  {item.school.name}
                </TableCell>
                <TableCell>
                  {item.school.type === SchoolType.Kindergarten ? "MŠ" : "ZŠ"}
                </TableCell>
                <TableCell>{item.analytics.total?.count}</TableCell>
                <TableCell>
                  {item.analytics.studentsUa?.count ? (
                    <>
                      {item.analytics.studentsUa.count} (
                      {item.analytics.studentsUa.percentage}%)
                    </>
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell>{item.analytics.consultationsNpi?.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
