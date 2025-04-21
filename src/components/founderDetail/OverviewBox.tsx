"use client";

import OverviewBoxButtons from "@/components/founderDetail/OverviewBoxButtons";
import { SchoolType } from "@/types/basicTypes";
import { texts } from "@/utils/shared/texts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Updated import
import { useRouter } from "next/navigation";
import { useState } from "react";
import { remult } from "remult";
import { City } from "../../entities/City";
import CityStatusChip from "../CityStatusChip";

export default function OverviewBox({
  cityProp,
  activeOrdinanceId,
  className,
  schoolType,
}: {
  cityProp: any;
  activeOrdinanceId?: number;
  className?: string;
  schoolType: SchoolType;
}) {
  const [city, setCity] = useState<City>(remult.repo(City).fromJson(cityProp));

  const router = useRouter();

  const fetchFounder = async () => {
    setCity(await remult.repo(City).findId(city.code, { useCache: false }));
    router.refresh();
  };

  const status =
    schoolType === SchoolType.Kindergarten
      ? city.statusKindergarten
      : city.statusElementary;

  const count =
    schoolType === SchoolType.Kindergarten
      ? city.kindergartenCount
      : city.schoolCount;

  return (
    <Card className={`${className ?? ""}`}>
      <CardHeader>
        <CardTitle>Podrobnosti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between w-60 my-1">
            <span>{texts.status}:</span>
            <CityStatusChip cityStatus={status} />
          </div>
          <div className="flex justify-between w-60 my-1">
            <span>{texts.numberOfSchools(schoolType)}:</span>
            <span>{count}</span>
          </div>
        </div>
        <OverviewBoxButtons
          city={city}
          fetchCity={fetchFounder}
          activeOrdinanceId={activeOrdinanceId}
          schoolType={schoolType}
        />
      </CardContent>
    </Card>
  );
}
