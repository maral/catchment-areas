import { SchoolType } from "@/types/basicTypes";
import {
  CitiesAnalyticsData,
  CityOnMap,
  CreateMapResult,
} from "@/types/mapTypes";
import { AnalyticsPublicMap } from "./AnalyticsPublicMap";
import { StandardPublicMap } from "./StandardPublicMap";

export const createPublicMap = (
  element: HTMLElement,
  cities: CityOnMap[],
  showControls: boolean = true,
  schoolType: SchoolType,
  showAnalyticsData: boolean = false,
  cityData: CitiesAnalyticsData = {}
): CreateMapResult => {
  if (showAnalyticsData) {
    const analyticsMap = new AnalyticsPublicMap(
      element,
      cities,
      showControls,
      schoolType,
      cityData
    );
    return analyticsMap.init();
  } else {
    const standardMap = new StandardPublicMap(
      element,
      cities,
      showControls,
      schoolType
    );
    return standardMap.init();
  }
};
