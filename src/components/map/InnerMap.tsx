import { createMap } from "@/components/map/createMap";
import { DataForMap, MapOptions } from "@/types/mapTypes";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

interface InnerMapProps {
  data: DataForMap;
  mapOptions: MapOptions;
  text?: string;
}

const InnerMap = ({ data, text, mapOptions = {} }: InnerMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current) {
      createMap(mapRef.current, data, text, mapOptions);
    }
  }, [data, text, mapOptions, mapRef]);

  return (
    <>
      <div
        ref={mapRef}
        className={`${
          mapOptions.fullHeight ? "h-screen" : "h-[calc(100vh-6rem)]"
        } w-full`}
      />
    </>
  );
};

InnerMap.displayName = "InnerMap";

export default InnerMap;
