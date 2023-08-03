"use client";

import Spinner from "@/components/common/Spinner";
import { CityOnMap, MunicipalitiesByCityCodes } from "@/types/mapTypes";
import dynamic from "next/dynamic";
import { useMemo } from "react";

export interface PublicMapProps {
  cities: CityOnMap[];
}

export default function PublicMap({ cities }: PublicMapProps) {
  const Map = useMemo(
    () =>
      dynamic(() => import("@/components/publicMap/InnerPublicMap"), {
        loading: () => <Spinner />,
        ssr: false,
      }),
    []
  );

  return <Map cities={cities} />;
}
