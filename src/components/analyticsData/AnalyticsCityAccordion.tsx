"use client";

import { loadCitySchools } from "@/app/admin/analytics/actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SchoolType } from "@/types/basicTypes";
import { texts } from "@/utils/shared/texts";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface AnalyticsCityAccordionProps {
  cityEntry: {
    city: {
      code: number;
      name: string;
    };
    schoolCount: number;
    populationDensity: { count: number } | null;
    socialExclusionIndex: { count: number } | null;
    earlySchoolLeavers: { count: number } | null;
  };
}

interface SchoolData {
  school: {
    izo: string;
    name: string;
    type: SchoolType;
  };
  analytics: {
    total?: { count: number };
    studentsUa?: { count: number; percentage: number };
    consultationsNpi?: { count: number };
  };
}

export default function AnalyticsCityAccordion({
  cityEntry,
}: AnalyticsCityAccordionProps) {
  const searchParams = useSearchParams();
  const [schools, setSchools] = useState<SchoolData[] | null>(null);
  const [loading, setLoading] = useState(false);

  const schoolType = searchParams.get("schoolType");
  const dataType = searchParams.get("dataType");

  useEffect(() => {
    setSchools(null);
  }, [schoolType, dataType]);

  const handleAccordionChange = async (value: string) => {
    if (value && schools === null) {
      try {
        setLoading(true);

        const schoolTypeCode =
          schoolType && schoolType !== "all" ? Number(schoolType) : undefined;
        const dataTypeCode =
          dataType && dataType !== "all" ? Number(dataType) : undefined;

        const data = await loadCitySchools(
          cityEntry.city.code,
          schoolTypeCode,
          dataTypeCode,
        );
        setSchools(data.schools || []);
      } catch (error) {
        console.error("Error loading schools:", error);
        setSchools([]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Accordion type="single" collapsible onValueChange={handleAccordionChange}>
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
              <TableRow className="border-0 hover:bg-transparent font-bold">
                <TableCell className="py-4">
                  {cityEntry.city.name} ({cityEntry.schoolCount})
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
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">
              {texts.loading}
            </div>
          ) : schools && schools.length > 0 ? (
            <Table>
              <colgroup>
                <col span={1} style={{ width: "25%" }} />
                <col span={1} style={{ width: "15%" }} />
                <col span={1} style={{ width: "20%" }} />
                <col span={1} style={{ width: "20%" }} />
                <col span={1} style={{ width: "20%" }} />
              </colgroup>
              <TableHeader>
                <TableRow className="text-xs">
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
                {schools.map((schoolItem) => (
                  <TableRow
                    key={`${schoolItem.school.izo}:${schoolItem.school.type}`}
                  >
                    <TableCell className="whitespace-break-spaces">
                      {schoolItem.school.name}
                    </TableCell>
                    <TableCell>
                      {schoolItem.school.type === SchoolType.Kindergarten
                        ? "MŠ"
                        : "ZŠ"}
                    </TableCell>
                    <TableCell>
                      {schoolItem.analytics.total?.count || "-"}
                    </TableCell>
                    <TableCell>
                      {schoolItem.analytics.studentsUa?.count ? (
                        <>
                          {schoolItem.analytics.studentsUa.count} (
                          {schoolItem.analytics.studentsUa.percentage}%)
                        </>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {schoolItem.analytics.consultationsNpi?.count || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : schools !== null ? (
            <div className="p-4 text-sm text-muted-foreground">
              {texts.noData}
            </div>
          ) : null}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
