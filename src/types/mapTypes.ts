import {
  CircleMarker,
  LayerGroup,
  Popup
} from "leaflet";
import { Municipality } from "text-to-map";

export interface CircleMarkerWithSchools extends CircleMarker {
  schools?: CircleMarkerWithSchools[];
}

export interface PopupWithMarker extends Popup {
  marker: CircleMarkerWithSchools;
}

export const isPopupWithMarker = (popup: Popup): popup is PopupWithMarker => {
  return popup.hasOwnProperty("marker");
};

export type MarkerMap = { [name: string]: CircleMarkerWithSchools };
export type AddressLayerGroup = LayerGroup<CircleMarkerWithSchools>;
export type AddressesLayerGroup = LayerGroup & { cityCode?: string; type?: string };
export type SchoolLayerGroup = LayerGroup<CircleMarker> & { cityCode?: string; type?: string };

export interface CityOnMap {
  code: number;
  name: string;
  isPublished: boolean;
  lat: number;
  lng: number;
}

export interface MunicipalitiesByCityCodes {
  [code: number]: Municipality[];
}

export interface LoadedCitiesData {
  [code: number]: {
    city: CityOnMap;
    addressesLayerGroup: AddressLayerGroup;
    schoolsLayerGroup: SchoolLayerGroup;
  };
}