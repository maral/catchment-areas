import { createMap } from "@/components/map/createMap";
import { DataForMap, MapOptions } from "@/types/mapTypes";
import { SuggestionItem } from "@/types/suggestionTypes";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { SearchInput } from "../publicMap/SearchInput";

interface InnerMapProps {
  data: DataForMap;
  mapOptions: MapOptions;
}

const InnerMap = ({ data, mapOptions = {} }: InnerMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [onSelect, setOnSelect] = useState<(item: SuggestionItem) => void>(
    () => () => {}
  );

  useEffect(() => {
    if (mapRef.current) {
      const { onSuggestionSelect, destructor } = createMap(
        mapRef.current,
        data,
        mapOptions
      );

      if (onSuggestionSelect) {
        setOnSelect(() => onSuggestionSelect);
      }
      return destructor;
    }
  }, [data, mapOptions, mapRef]);

  return (
    <>
      {mapOptions.showSearch && (
        <div className="absolute left-[10px] top-[10px] z-1000 w-[calc(100vw-20px)] max-w-[400px]">
          <div></div>
          <SearchInput onSelect={onSelect} />
        </div>
      )}

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
