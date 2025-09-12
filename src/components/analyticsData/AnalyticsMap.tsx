"use client";

import Spinner from "@/components/common/Spinner";
import { SchoolType } from "@/types/basicTypes";
import { CityOnMap } from "@/types/mapTypes";
import dynamic from "next/dynamic";
import { useMemo } from "react";
export interface PublicMapProps {
  cities: CityOnMap[];
  schoolType: SchoolType;
}

export default function AnalyticsMap({ cities, schoolType }: PublicMapProps) {
  const Map = useMemo(
    () =>
      dynamic(() => import("@/components/analyticsData/InnerAnalyticsMap"), {
        loading: () => <Spinner />,
        ssr: false,
      }),
    []
  );

  return <Map cities={cities} schoolType={schoolType} />;
}
