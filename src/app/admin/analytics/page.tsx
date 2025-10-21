import { api } from "@/app/api/[...remult]/api";
import AnalyticsActions from "@/components/analyticsData/AnalyticsActions";
import AnalyticsFilter from "@/components/analyticsData/AnalyticsFilter";
import HeaderBox from "@/components/common/HeaderBox";
import { loadAnalyticsData } from "@/components/table/fetchFunctions/loadAnalyticsData";
import { loadCities } from "@/components/table/fetchFunctions/loadCities";
import { Card, CardContent, CardHeader } from "@/components/ui/card"; // Updated import
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionTrigger,
  AccordionItem,
} from "@/components/ui/accordion";
import { SchoolType } from "@/types/basicTypes";
import { texts } from "@/utils/shared/texts";

export default async function Analytics(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const selectedSchoolType = searchParams.schoolType || "all";
  const selectedDataType = searchParams.dataType || "all";
  const selectedCity = searchParams.city || "all";

  const schoolTypeCode =
    selectedSchoolType === "all" ? undefined : Number(selectedSchoolType);

  const dataTypeCode =
    selectedDataType === "all" ? undefined : Number(selectedDataType);

  const cityCode = selectedCity === "all" ? undefined : Number(selectedCity);

  const { data, count } = await api.withRemult(async () => {
    const data = await loadAnalyticsData(
      schoolTypeCode,
      dataTypeCode,
      cityCode
    );
    const totalSchools = data.reduce(
      (sum, city) => sum + city.schools.length,
      0
    );
    return { data, count: totalSchools };
  });

  const cities = await api.withRemult(async () => {
    const cities = await loadCities();

    return cities.map((city) => ({
      code: city.code,
      name: city.name,
    }));
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
            selectedCity={selectedCity}
            cities={cities}
          />
        </div>

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
            {data.map((cityEntry, cityIndex) => (
              <TableRow key={cityEntry.city.code}>
                <TableCell colSpan={4} className="p-0">
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue={`city-${cityEntry.city.code}`}
                  >
                    <AccordionItem value={`city-${cityEntry.city.code}`}>
                      <AccordionTrigger className="hover:no-underline cursor-pointer p-0 bg-muted/50">
                        <Table className="w-full">
                          <colgroup>
                            <col span={1} style={{ width: "40%" }} />
                            <col span={1} style={{ width: "20%" }} />
                            <col span={1} style={{ width: "20%" }} />
                            <col span={1} style={{ width: "20%" }} />
                          </colgroup>
                          <TableBody>
                            <TableRow className="border-0  hover:bg-transparent font-bold">
                              <TableCell className="py-4">
                                {cityEntry.city.name} (
                                {cityEntry.schools.length})
                              </TableCell>
                              <TableCell className="py-4">
                                {cityEntry.populationDensity?.count || "-"}
                              </TableCell>
                              <TableCell className="py-4">
                                {cityEntry.socialExclusionIndex?.count || "-"}
                              </TableCell>
                              <TableCell className="py-4">
                                {cityEntry.earlySchoolLeavers?.count || "-"}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </AccordionTrigger>
                      <AccordionContent className="border-t">
                        {cityEntry.schools.length > 0 ? (
                          <Table>
                            <colgroup>
                              <col span={1} style={{ width: "25%" }} />
                              <col span={1} style={{ width: "15%" }} />
                              <col span={1} style={{ width: "20%" }} />
                              <col span={1} style={{ width: "20%" }} />
                              <col span={1} style={{ width: "20%" }} />
                            </colgroup>
                            <TableHeader>
                              <TableRow className="text-xs ">
                                <TableHead className="font-semibold">
                                  {texts.school}
                                </TableHead>
                                <TableHead className="font-semibold">
                                  {texts.schoolType}
                                </TableHead>
                                <TableHead className="whitespace-break-spaces font-semibold">
                                  {texts.analyticsTotalStudents}
                                </TableHead>
                                <TableHead className="whitespace-break-spaces font-semibold">
                                  {texts.analyticsUaStudents}
                                </TableHead>
                                <TableHead className="whitespace-break-spaces font-semibold">
                                  {texts.analyticsConsultationsNpi}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cityEntry.schools.map((schoolItem: any) => (
                                <TableRow
                                  key={`${schoolItem.school.izo}:${schoolItem.school.type}`}
                                >
                                  <TableCell className="whitespace-break-spaces">
                                    {schoolItem.school.name}
                                  </TableCell>
                                  <TableCell>
                                    {schoolItem.school.type ===
                                    SchoolType.Kindergarten
                                      ? "MŠ"
                                      : "ZŠ"}
                                  </TableCell>
                                  <TableCell>
                                    {schoolItem.analytics.total?.count || "-"}
                                  </TableCell>
                                  <TableCell>
                                    {schoolItem.analytics.studentsUa?.count ? (
                                      <>
                                        {schoolItem.analytics.studentsUa.count}{" "}
                                        (
                                        {
                                          schoolItem.analytics.studentsUa
                                            .percentage
                                        }
                                        %)
                                      </>
                                    ) : (
                                      "-"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {schoolItem.analytics.consultationsNpi
                                      ?.count || "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="p-4 text-sm text-muted-foreground">
                            {texts.noData}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
