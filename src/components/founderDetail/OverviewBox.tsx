"use client";

import OverviewBoxButtons from "@/components/founderDetail/OverviewBoxButtons";
import { SchoolType } from "@/types/basicTypes";
import { texts } from "@/utils/shared/texts";
import { Card, Subtitle, Title } from "@tremor/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { remult } from "remult";
import { City } from "../../entities/City";
import CityStatusChip from "../CityStatusChip";

export default function OverviewBox({
  cityProp,
  activeOrdinanceId,
  urlFrom,
  className,
  schoolType,
}: {
  cityProp: any;
  activeOrdinanceId?: number;
  urlFrom?: string[];
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
      <div className="mb-4">
        <div className="flex justify-between w-60 my-1">
          <Subtitle className="text-tremor-content">{texts.status}:</Subtitle>
          <CityStatusChip cityStatus={status} />
        </div>
        <div className="flex justify-between w-60 my-1">
          <Subtitle className="text-tremor-content">
            {texts.numberOfSchools(schoolType)}:
          </Subtitle>
          <Title className="mr-2">{count}</Title>
        </div>
      </div>
      <OverviewBoxButtons
        city={city}
        fetchCity={fetchFounder}
        activeOrdinanceId={activeOrdinanceId}
        urlFrom={urlFrom}
        schoolType={schoolType}
      />
    </Card>
  );
}
