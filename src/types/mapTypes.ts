import { FeatureCollection } from "@turf/helpers";
import {
  Circle,
  LayerGroup,
  Marker,
  Popup,
  GeoJSON,
  FeatureGroup,
} from "leaflet";
import { Municipality } from "text-to-map";
import { FounderType } from "../entities/Founder";

export type SchoolMarker = Circle;

export type MarkerWithSchools = (Marker | Circle) & {
  schools?: Circle[];
};

export interface PopupWithMarker extends Popup {
  marker: MarkerWithSchools;
}

export const isPopupWithMarker = (popup: Popup): popup is PopupWithMarker => {
  return popup.hasOwnProperty("marker");
};

export type SchoolMarkerMap = Record<string, SchoolMarker>;
export type AddressMarkerMap = Record<string, MarkerWithSchools[]>;
export type AddressLayerGroup = LayerGroup<MarkerWithSchools>;
export type AddressesLayerGroup = LayerGroup & {
  cityCode?: string;
  type?: string;
};
export type SchoolLayerGroup = FeatureGroup<MarkerWithSchools | Circle> & {
  cityCode?: string;
  type?: string;
};

export interface CityOnMap {
  code: number;
  name: string;
  isPublished: boolean;
  lat: number;
  lng: number;
}

export type SmdText = {
  founderId: number;
  founderName: string;
  founderType: FounderType;
  sourceText: string;
};

export type DataForMap = {
  municipalities: Municipality[];
  polygons: FeatureCollection[];
  text: string;
};

export type DataForMapByCityCodes = Record<number, DataForMap>;

export type LoadedCitiesData = Record<number, CityData>;

export interface CityData {
  city: CityOnMap;
  data: DataForMap;
  addressesLayerGroup: AddressLayerGroup;
  schoolsLayerGroup: SchoolLayerGroup;
  polygonLayerGroup: FeatureGroup;
  addressMarkers: AddressMarkerMap;
}

export type MapOptions = {
  fullHeight?: boolean;
  useQueryParams?: boolean;
  pageType?: PageType;
  color?: string;
  showControls?: boolean;
  showLayerControls?: boolean;
  showDebugInfo?: boolean;
};

export type PageType = "city" | "school";

export interface EmbedQueryParams {
  color?: string;
  showSearch: boolean;
  showControls: boolean;
}
