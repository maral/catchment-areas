"use client";

import Spinner from "@/components/common/Spinner";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { DataForMap, MapOptions } from "@/types/mapTypes";
import useQueryParams from "../../utils/client/useQueryParams";

export interface CatchmentMapProps {
  data: DataForMap;
  mapOptions: MapOptions;
}

export default function CatchmentMap({ data, mapOptions }: CatchmentMapProps) {
  const queryParams = useQueryParams(mapOptions.pageType);

  const options = queryParams ? { ...mapOptions, ...queryParams } : mapOptions;

  const Map = useMemo(
    () =>
      dynamic(() => import("@/components/map/InnerMap"), {
        loading: () => <Spinner />,
        ssr: false,
      }),
    []
  );

  return <Map data={data} mapOptions={options} />;
}
