import { createMap } from "@/components/publicMap/createMap";
import { CityOnMap } from "@/types/mapTypes";
import "leaflet/dist/leaflet.css";
import { memo, useEffect, useRef } from "react";

interface InnerPublicMapProps {
  cities: CityOnMap[];
}

const InnerMap = memo(
  ({ cities }: InnerPublicMapProps) => {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (mapRef.current) {
        return createMap(mapRef.current, cities, undefined);
      }
    }, [cities, mapRef]);

    return (
      <>
        <div ref={mapRef} className="h-screen" />
      </>
    );
  },
  (prevProps: InnerPublicMapProps, nextProps: InnerPublicMapProps) => {
    return prevProps.cities === nextProps.cities;
  }
);

InnerMap.displayName = "InnerPublicMap";

export default InnerMap;
