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
import SwitchButton from "../buttons/SwitchButton";
import { SchoolType } from "@/types/basicTypes";
import { useRouter } from "next/navigation";
import { AcademicCapIcon, PuzzlePieceIcon } from "@heroicons/react/24/solid";

interface InnerPublicMapProps {
  cities: CityOnMap[];
  schoolType: SchoolType;
}

const InnerMap = memo(
  ({ cities, schoolType }: InnerPublicMapProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [onSelect, setOnSelect] = useState<(item: SuggestionItem) => void>(
      () => () => {}
    );

    useEffect(() => {
      if (mapRef.current) {
        const { onSuggestionSelect, destructor } = createPublicMap(
          mapRef.current,
          cities,
          true,
          schoolType
        );
        if (onSuggestionSelect) {
          setOnSelect(() => onSuggestionSelect);
        }
        return destructor;
      }
    }, [cities, schoolType, mapRef]);

    const handleChange = (value: any) => {
      if (value === SchoolType.Elementary) {
        window.location.href = "/zs";
      } else {
        window.location.href = "/ms";
      }
    };

    return (
      <>
        <div ref={mapRef} className="h-screen w-screen" />

        <div className="absolute top-[10px] px-2.5 z-1000 flex justify-between items-center gap-2.5 w-full md:max-w-[calc(100vw-260px)] flex-wrap">
          <div className="flex items-center gap-2.5 w-full sm:w-fit">
            <Menu />
            <div className="w-[calc(100vw-80px)] sm:max-w-[430px]">
              <SearchInput onSelect={onSelect} />
            </div>
          </div>
          <div className="sm:w-fit w-full ">
            <SwitchButton
              segments={[
                {
                  label: texts.schoolsKindergarten,
                  icon: PuzzlePieceIcon,
                  value: SchoolType.Kindergarten,
                },
                {
                  label: texts.schoolsElementary,
                  icon: AcademicCapIcon,
                  value: SchoolType.Elementary,
                },
              ]}
              defaultValue={schoolType}
              onValueChange={handleChange}
            />
          </div>
          <div></div>
        </div>

        {/* <div className="absolute top-[10px] left-[10px] z-1001">
          <Menu />
        </div>
        <div className="absolute top-[10px] left-[70px] z-1000 w-[min(430px,calc(100vw-80px))]">
          <SearchInput onSelect={onSelect} />
        </div> */}

        <div
          className="absolute z-1000 bottom-0 left-0
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

          <Link href="https://www.npi.cz/" target="_blank">
            <Image
              className="hidden md:block"
              src="logo_npi_svg_full.svg"
              alt="Logo NPI"
              width={228}
              height={33}
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
          className="absolute bottom-[80px] md:bottom-[8px] left-[8px] z-1000 bg-slate-50"
          icon={ExclamationTriangleIcon}
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
