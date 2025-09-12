"use client";

import { createPublicMap } from "@/components/publicMap/createPublicMap";
import { SearchInput } from "@/components/publicMap/SearchInput";
import { SchoolType } from "@/types/basicTypes";
import { CityOnMap } from "@/types/mapTypes";
import { AcademicCapIcon, PuzzlePieceIcon } from "@heroicons/react/24/solid";
import "leaflet/dist/leaflet.css";
import { memo, useEffect, useRef, useState } from "react";
import { SuggestionItem } from "../../types/suggestionTypes";
import { texts } from "../../utils/shared/texts";
import { SwitchButton } from "../buttons/SwitchButton";

interface InnerAnalyticsMapProps {
  cities: CityOnMap[];
  schoolType: SchoolType;
}

const InnerAnalyticsMap = memo(
  ({ cities, schoolType }: InnerAnalyticsMapProps) => {
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
          schoolType,
          true
        );
        if (onSuggestionSelect) {
          setOnSelect(() => onSuggestionSelect);
        }
        return destructor;
      }
    }, [cities, schoolType, mapRef]);

    const handleChange = (value: SchoolType) => {
      if (value === SchoolType.Elementary) {
        window.location.href = "/admin/map/zs";
      } else {
        window.location.href = "/admin/map/ms";
      }
    };

    return (
      <>
        <div className="relative">
          <div ref={mapRef} className="h-[calc(100vh-6rem)] w-full" />

          <div className="absolute top-[10px] px-2.5 z-1000 flex justify-between items-center gap-2.5 w-full md:max-w-[calc(100vw-520px)] flex-wrap">
            <div className="flex items-center gap-2.5 w-full sm:w-fit">
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
        </div>
      </>
    );
  },
  (prevProps: InnerAnalyticsMapProps, nextProps: InnerAnalyticsMapProps) => {
    return prevProps.cities === nextProps.cities;
  }
);

InnerAnalyticsMap.displayName = "InnerAnalyticsMap";

export default InnerAnalyticsMap;
