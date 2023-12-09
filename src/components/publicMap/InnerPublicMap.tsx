import { createMap } from "@/components/publicMap/createMap";
import { CityOnMap } from "@/types/mapTypes";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import Link from "next/link";
import { memo, useEffect, useRef } from "react";

interface InnerPublicMapProps {
  cities: CityOnMap[];
}

const InnerMap = memo(
  ({ cities }: InnerPublicMapProps) => {
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (mapRef.current) {
        return createMap(mapRef.current, cities, true);
      }
    }, [cities, mapRef]);

    return (
      <>
        <div ref={mapRef} className="h-screen w-screen" />

        <div className="absolute top-0 right-0 z-[1000]
          flex flex-col gap-2 items-center text-center
          p-4 rounded-bl-lg bg-gray-50/60">
          <Link
            href="/"
            className="block text-3xl font-title font-medium text-slate-700"
          >
            Spádové oblasti
          </Link>

          <Link href="https://www.npi.cz/" target="_blank" className="p-2">
            <Image
              src="logo_npi_svg_full.svg"
              alt="Logo NPI"
              width={200}
              height={29}
            />
          </Link>
        </div>
      </>
    );
  },
  (prevProps: InnerPublicMapProps, nextProps: InnerPublicMapProps) => {
    return prevProps.cities === nextProps.cities;
  }
);

InnerMap.displayName = "InnerPublicMap";

export default InnerMap;
