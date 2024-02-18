"use client";

import Spinner from "@/components/common/Spinner";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { DataForMap } from "@/types/mapTypes";

export interface CatchmentMapProps {
  data: DataForMap;
  text: string;
}

export default function CatchmentMap({ data, text }: CatchmentMapProps) {
  const Map = useMemo(
    () =>
      dynamic(() => import("@/components/map/InnerMap"), {
        loading: () => <Spinner />,
        ssr: false,
      }),
    []
  );

  return <Map data={data} text={text} />;
}
