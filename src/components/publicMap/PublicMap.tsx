"use client";

import Spinner from "@/components/common/Spinner";
import { CityOnMap } from "@/types/mapTypes";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { SchoolType } from "@/types/basicTypes";
export interface PublicMapProps {
  cities: CityOnMap[];
  schoolType: SchoolType;
}

export default function PublicMap({ cities, schoolType }: PublicMapProps) {
  const Map = useMemo(
    () =>
      dynamic(() => import("@/components/publicMap/InnerPublicMap"), {
        loading: () => <Spinner />,
        ssr: false,
      }),
    []
  );

  return <Map cities={cities} schoolType={schoolType} />;
}
