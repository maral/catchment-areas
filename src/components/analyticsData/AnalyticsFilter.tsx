"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SchoolType, AnalyticsDataType } from "@/types/basicTypes";

import { useSearchParams, useRouter } from "next/navigation";

export default function AnalyticsFilter({
  selectedSchoolType,
  selectedDataType,
  count,
}: {
  selectedSchoolType: string | null;
  selectedDataType: string | null;
  count: number;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`?${params.toString()}`);
  };

  const handleSchoolTypeChange = (schoolType: string) =>
    updateParam("schoolType", schoolType);
  const handleDataTypeChange = (dataType: string) =>
    updateParam("dataType", dataType);

  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-3 gap-8">
          <div className="">
            <Label className="mb-4">Typ školy</Label>
            <Select
              onValueChange={handleSchoolTypeChange}
              value={selectedSchoolType ? String(selectedSchoolType) : "all"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Typ školy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">
                  Vše
                </SelectItem>
                <SelectItem
                  key={SchoolType.Kindergarten}
                  value={String(SchoolType.Kindergarten)}
                >
                  MŠ
                </SelectItem>
                <SelectItem
                  key={SchoolType.Elementary}
                  value={String(SchoolType.Elementary)}
                >
                  ZŠ
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-4">Typ dat</Label>
            <Select
              onValueChange={handleDataTypeChange}
              value={selectedDataType ? String(selectedDataType) : "all"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Typ dat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">
                  Vše
                </SelectItem>
                <SelectItem
                  key={AnalyticsDataType.StudentsUa}
                  value={String(AnalyticsDataType.StudentsUa)}
                >
                  Studenti UA
                </SelectItem>
                <SelectItem
                  key={AnalyticsDataType.ConsultationsNpi}
                  value={String(AnalyticsDataType.ConsultationsNpi)}
                >
                  Konzultace NPI
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="">
            <Label className="mb-4">Počet záznamů</Label>
            <div className="py-2 text-sm">{count}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
