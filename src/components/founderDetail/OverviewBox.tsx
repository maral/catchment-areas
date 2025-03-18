"use client";

import { Card, Subtitle, Title } from "@tremor/react";
import OverviewBoxButtons from "@/components/founderDetail/OverviewBoxButtons";
import { texts } from "@/utils/shared/texts";
import { Founder } from "@/entities/Founder";
import { useState } from "react";
import { remult } from "remult";
import CityStatusChip from "../CityStatusChip";
import { useRouter } from "next/navigation";
import { City } from "../../entities/City";

export default function OverviewBox({
  cityProp,
  activeOrdinanceId,
  urlFrom,
  className,
}: {
  cityProp: any;
  activeOrdinanceId?: number;
  urlFrom?: string[];
  className?: string;
}) {
  const [city, setCity] = useState<City>(remult.repo(City).fromJson(cityProp));

  const router = useRouter();

  const fetchFounder = async () => {
    setCity(await remult.repo(City).findId(city.code, { useCache: false }));
    router.refresh();
  };

  return (
    <Card className={`${className ?? ""}`}>
      <div className="mb-4">
        <div className="flex justify-between w-60 my-1">
          <Subtitle className="text-tremor-content">{texts.status}:</Subtitle>
          <CityStatusChip cityStatus={city.statusElementary} />
        </div>
        <div className="flex justify-between w-60 my-1">
          <Subtitle className="text-tremor-content">
            {texts.numberOfSchools}:
          </Subtitle>
          <Title className="mr-2">{city.schoolCount}</Title>
        </div>
      </div>
      <OverviewBoxButtons
        city={city}
        fetchCity={fetchFounder}
        activeOrdinanceId={activeOrdinanceId}
        urlFrom={urlFrom}
      />
    </Card>
  );
}
