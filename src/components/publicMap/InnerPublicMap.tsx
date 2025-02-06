"use client";

import { createPublicMap } from "@/components/publicMap/createPublicMap";
import { CityOnMap } from "@/types/mapTypes";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import "leaflet/dist/leaflet.css";
import Image from "next/image";
import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
import { SuggestionItem } from "../../types/suggestionTypes";
import { texts } from "../../utils/shared/texts";
import PublicButton from "../buttons/PublicButton";
import { SearchInput } from "./SearchInput";
import { Menu } from "./Menu";

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

        <Menu />

        <div className="absolute top-[10px] left-[70px] z-[1000] w-[min(430px,calc(100vw-80px))]">
          <SearchInput onSelect={onSelect} />
        </div>

        <div
          className="absolute z-[1000] bottom-0 left-0
          flex flex-col gap-1 items-center text-center
          p-2 bg-gray-50/60 rounded-tr-lg
          md:top-0 md:right-0 md:left-auto md:bottom-auto md:rounded-bl-lg md:rounded-tl-none
          md:p-4 md:gap-2"
        >
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

        <PublicButton
          href={texts.URL_reportBug}
          target="_blank"
          className="absolute bottom-[80px] md:bottom-[8px] left-[8px] z-[1000] bg-slate-50"
          icon={ExclamationTriangleIcon}
          color="amber"
        >
          {texts.reportBug}
        </PublicButton>
      </>
    );
  },
  (prevProps: InnerPublicMapProps, nextProps: InnerPublicMapProps) => {
    return prevProps.cities === nextProps.cities;
  }
);

InnerMap.displayName = "InnerPublicMap";

export default InnerMap;
