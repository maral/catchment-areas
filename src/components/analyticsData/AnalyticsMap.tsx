"use client";

import Spinner from "@/components/common/Spinner";
import { SchoolType } from "@/types/basicTypes";
import { CitiesAnalyticsData, CityOnMap, LegendItem } from "@/types/mapTypes";
import dynamic from "next/dynamic";
import { useMemo } from "react";
export interface PublicMapProps {
  cities: CityOnMap[];
  schoolType: SchoolType;
  citiesData?: CitiesAnalyticsData;
  legendData?: LegendItem[];
}

export default function AnalyticsMap({
  cities,
  schoolType,
  citiesData,
  legendData,
}: PublicMapProps) {
  const Map = useMemo(
    () =>
      dynamic(() => import("@/components/analyticsData/InnerAnalyticsMap"), {
        loading: () => <Spinner />,
        ssr: false,
      }),
    []
  );

  return (
    <Map
      cities={cities}
      schoolType={schoolType}
      citiesData={citiesData}
      legendData={legendData}
    />
  );
}
