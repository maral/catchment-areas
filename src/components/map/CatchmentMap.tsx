"use client";

import Spinner from "@/components/common/Spinner";
import dynamic from "next/dynamic";
import { useMemo } from "react";
import { Municipality } from "text-to-map";

export interface CatchmentMapProps {
  municipalities: Municipality[];
  text: string;
}

export default function CatchmentMap({ municipalities, text }: CatchmentMapProps) {
  const Map = useMemo(
    () =>
      dynamic(() => import("@/components/map/InnerMap"), {
        loading: () => <Spinner />,
        ssr: false,
      }),
    []
  );

  return (
    <Map
      municipalities={municipalities}
      text={text}
    />
  );
}
