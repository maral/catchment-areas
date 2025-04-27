"use client";

import OverviewBoxButtons from "@/components/founderDetail/OverviewBoxButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  City,
  getCountPropertyBySchoolType,
  getStatusPropertyBySchoolType,
} from "@/entities/City";
import { SchoolType } from "@/types/basicTypes";
import { texts } from "@/utils/shared/texts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { remult } from "remult";
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

  return (
    <Card className={`${className ?? ""}`}>
      <CardHeader>
        <CardTitle>Podrobnosti</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between w-60 my-1">
            <span>{texts.status}:</span>
            <CityStatusChip
              cityStatus={city[getStatusPropertyBySchoolType(schoolType)]}
            />
          </div>
          <div className="flex justify-between w-60 my-1">
            <span>{texts.numberOfSchools(schoolType)}:</span>
            <span>{city[getCountPropertyBySchoolType(schoolType)]}</span>
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
