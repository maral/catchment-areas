import { Circle, LayerGroup, Marker, Popup } from "leaflet";
import { Municipality } from "text-to-map";

export type SchoolMarker = Circle

export type MarkerWithSchools = (Marker | Circle) & {
  schools?: Circle[];
}

export interface PopupWithMarker extends Popup {
  marker: MarkerWithSchools;
}

export const isPopupWithMarker = (popup: Popup): popup is PopupWithMarker => {
  return popup.hasOwnProperty("marker");
};

export type MarkerMap = { [name: string]: MarkerWithSchools | SchoolMarker };
export type AddressLayerGroup = LayerGroup<MarkerWithSchools>;
export type AddressesLayerGroup = LayerGroup & {
  cityCode?: string;
  type?: string;
};
export type SchoolLayerGroup = LayerGroup<MarkerWithSchools | Circle> & {
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
