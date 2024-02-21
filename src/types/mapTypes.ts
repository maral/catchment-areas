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

export type SchoolMarkerMap = { [name: string]: SchoolMarker };
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

export type DataForMap = {
  municipalities: Municipality[];
  polygons: FeatureCollection[];
};

export type DataForMapByCityCodes = Record<number, DataForMap>;

export type LoadedCitiesData = Record<number, CityData>;

export interface CityData {
  city: CityOnMap;
  addressesLayerGroup: AddressLayerGroup;
  schoolsLayerGroup: SchoolLayerGroup;
  polygonLayer: GeoJSON;
}
