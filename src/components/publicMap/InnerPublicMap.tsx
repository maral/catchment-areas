import { createPublicMap } from "@/components/publicMap/createPublicMap";
import { CityOnMap } from "@/types/mapTypes";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
import { SearchInput } from "./SearchInput";
import { SuggestionItem } from "../../types/suggestionTypes";

interface InnerPublicMapProps {
  cities: CityOnMap[];
}

const InnerMap = memo(
  ({ cities }: InnerPublicMapProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [onSelect, setOnSelect] = useState<(item: SuggestionItem) => void>(
      () => () => {}
    );

    useEffect(() => {
      if (mapRef.current) {
        const { onSuggestionSelect, destructor } = createPublicMap(
          mapRef.current,
          cities,
          true
        );
        if (onSuggestionSelect) {
          setOnSelect(() => onSuggestionSelect);
        }
        return destructor;
      }
    }, [cities, mapRef]);

    return (
      <>
        <div ref={mapRef} className="h-screen w-screen" />

        <div className="absolute top-[10px] left-[54px] z-[1000] w-[min(450px,calc(100vw-64px))]">
          <SearchInput onSelect={onSelect} />
        </div>

        <div
          className="absolute z-[1000] bottom-[16px] right-0
          flex flex-col gap-1 items-center text-center
          p-2 bg-gray-50/60 rounded-tl-lg
          md:top-0 md:bottom-auto md:rounded-bl-lg md:rounded-tl-lg-none
          md:p-4 md:gap-2"
        >
          <Image
            src="/beta.png"
            alt="Beta Icon"
            className="absolute top-0 right-0"
            width={60}
            height={60}
          />
          <Link
            href="/"
            className="block text-xl md:text-3xl font-title font-medium text-slate-700"
          >
            Spádové oblasti
          </Link>

          <Link href="https://www.npi.cz/" target="_blank" className="md:p-2">
            <Image
              className="hidden md:block"
              src="logo_npi_svg_full.svg"
              alt="Logo NPI"
              width={200}
              height={29}
            />
            <Image
              className="block md:hidden"
              src="logo_npi_svg_full.svg"
              alt="Logo NPI"
              width={150}
              height={22}
            />
          </Link>
        </div>

        <div className="absolute bottom-[24px] left-[16px] z-[1000]">
          <a
            href="#"
            target="_blank"
            className="px-5 py-4 bg-blue-500 text-white text-lg rounded-md"
          >
            Nahlásit chybu
          </a>
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
