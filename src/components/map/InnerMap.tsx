import { createMap } from "@/components/map/createMap";
import { DataForMap } from "@/types/mapTypes";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

interface InnerMapProps {
  data: DataForMap;
  text: string;
}

const InnerMap = ({ data, text }: InnerMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current) {
      createMap(mapRef.current, data, text, undefined, undefined, true);
    }
  }, [data, text, mapRef]);

  return (
    <>
      <div ref={mapRef} className="h-[calc(100vh-8rem)]" />
    </>
  );
};

InnerMap.displayName = "InnerMap";

export default InnerMap;
