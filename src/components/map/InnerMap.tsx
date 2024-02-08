import "leaflet/dist/leaflet.css";
import { memo, useEffect, useRef } from "react";
import { createMap } from "@/components/map/createMap";
import { Municipality } from "text-to-map";

interface InnerMapProps {
  municipalities: Municipality[];
  text: string;
}

const InnerMap = memo(
  ({ municipalities, text }: InnerMapProps) => {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (mapRef.current) {
        createMap(
          mapRef.current,
          municipalities,
          text,
          undefined,
          undefined,
          true
        );
      }
    }, [municipalities, text, mapRef]);

    return (
      <>
        <div ref={mapRef} className="h-[calc(100vh-8rem)]" />
      </>
    );
  },
  (prevProps: InnerMapProps, nextProps: InnerMapProps) => {
    return prevProps.municipalities === nextProps.municipalities;
  }
);

InnerMap.displayName = "InnerMap";

export default InnerMap;
