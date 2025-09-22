"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnalyticsDataType, SchoolType } from "@/types/basicTypes";

import { City } from "@/types/embed";
import { texts } from "@/utils/shared/texts";
import { useRouter, useSearchParams } from "next/navigation";
export default function AnalyticsFilter({
  selectedSchoolType,
  selectedDataType,
  count,
  selectedCity,
  cities,
}: {
  selectedSchoolType: string | null;
  selectedDataType: string | null;
  count: number;
  selectedCity: string | null;
  cities: City[];
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
  const handleCityChange = (city: string) => updateParam("city", city);

  return (
    <Card>
      <CardContent>
        <div className="grid grid-cols-4 gap-8">
          <div className="">
            <Label className="mb-4">{texts.schoolType}</Label>
            <Select
              onValueChange={handleSchoolTypeChange}
              value={selectedSchoolType ? String(selectedSchoolType) : "all"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={texts.schoolType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">
                  {texts.all}
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
            <Label className="mb-4">{texts.analyticsDataType}</Label>
            <Select
              onValueChange={handleDataTypeChange}
              value={selectedDataType ? String(selectedDataType) : "all"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={texts.analyticsDataType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">
                  {texts.all}
                </SelectItem>
                <SelectItem
                  key={AnalyticsDataType.StudentsUa}
                  value={String(AnalyticsDataType.StudentsUa)}
                >
                  {texts.uaStudents}
                </SelectItem>
                <SelectItem
                  key={AnalyticsDataType.ConsultationsNpi}
                  value={String(AnalyticsDataType.ConsultationsNpi)}
                >
                  {texts.consultationsNpi}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-4">{texts.city}</Label>
            <Select
              onValueChange={handleCityChange}
              value={selectedCity ? String(selectedCity) : "all"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={texts.city} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">
                  {texts.all}
                </SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.code} value={String(city.code)}>
                    {city.name}
                  </SelectItem>
                ))}
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
