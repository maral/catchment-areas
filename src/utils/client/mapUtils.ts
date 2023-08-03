import {
  AddressLayerGroup,
  CircleMarkerWithSchool,
  MarkerMap,
  MunicipalitiesByCityCodes,
  PopupWithMarker,
  SchoolLayerGroup,
  isPopupWithMarker
} from "@/types/mapTypes";
import L, { LatLngBounds, Map, Polyline, PopupEvent } from "leaflet";
import { School } from "text-to-map";

export const colors = [
  "c686d0",
  "d33d81",
  "0ea13b",
  "0082ad",
  "f17b5a",
  "c45a18",
  "2bc6d9",
  "81b2e9",
  "6279bd",
];

export const markerRadius = 4;
export const markerWeight = 2;
export const selectedMarkerRadius = 8;
export const selectedMarkerWeight = 5;
export const minZoomForAddressPoints = 16;
export const selectedMarkerColor = "#ffff00";

export const prepareMap = (
  element: HTMLElement,
  showControls: boolean
): Map => {
  const map = L.map(element, {
    renderer: L.canvas({ padding: 0.5 }),
    zoomControl: showControls,
  });
  L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
  }).addTo(map);

  return map;
};

let lastListener: () => void;

export const setupPopups = (map: Map): void => {
  map.on("popupopen", function (e: PopupEvent) {
    const popup = e.popup;
    if (isPopupWithMarker(popup)) {
      lastListener = () => {
        centerLeafletMapOnMarker(map, popup.marker);
      };
      const button =
        // @ts-ignore not ideal but unfortunately not other way to get the button
        e.popup._source._popup._contentNode.querySelector(".marker-button");
      button.addEventListener("click", lastListener);
    }
  });

  map.on("popupclose", function (e: PopupEvent) {
    const popup = e.popup;
    if (isPopupWithMarker(popup) && lastListener) {
      const button =
        // @ts-ignore
        e.popup._source._popup._contentNode.querySelector(".marker-button");
      button.removeEventListener("click", lastListener);
    }
  });
};

const defaultPosition = [49.19506, 16.606837];

export const createSchoolMarkers = (
  school: School,
  color: string,
  schoolLayerGroup: SchoolLayerGroup,
  addressLayerGroup: AddressLayerGroup,
  markers: MarkerMap,
  bounds: LatLngBounds
): void => {
  const schoolMarker = L.circle(
    [
      school.position?.lat ?? defaultPosition[0],
      school.position?.lng ?? defaultPosition[1],
    ],
    {
      radius: 15,
      fill: true,
      fillColor: color,
      fillOpacity: 1,
      weight: 8,
      color,
    }
  )
    .bindPopup(school.name)
    .addTo(schoolLayerGroup);

  markers[school.name] = schoolMarker;
  bounds.extend(schoolMarker.getLatLng());

  school.addresses.forEach((point) => {
    if (!point.lat || !point.lng) {
      return;
    }

    const marker: CircleMarkerWithSchool = L.circle([point.lat, point.lng], {
      radius: markerRadius,
      weight: markerWeight,
      fill: true,
      fillColor: color,
      fillOpacity: 1,
      color,
    });
    const popup: PopupWithMarker = Object.assign(
      L.popup().setContent(`
      <div>
        ${point.address}
        <div class="text-center mt-2"><button class="btn btn-success btn-sm marker-button">
          Zobrazit spádovou školu    
        </button></div>
      </div>`),
      { marker: marker }
    );
    marker.bindPopup(popup);
    marker.school = schoolMarker;
    addressLayerGroup.addLayer(marker);
    bounds.extend(marker.getLatLng());
    markers[point.address] = marker;
  });
};

export const createZoomEndHandler = (
  map: Map,
  municipalityLayerGroups: AddressLayerGroup[]
) => {
  if (municipalityLayerGroups.length <= 1) {
    return () => null;
  }
  let added = false;
  return () => {
    if (map.getZoom() < minZoomForAddressPoints && added === true) {
      municipalityLayerGroups.forEach((layerGroup) => {
        map.removeLayer(layerGroup);
      });
      added = false;
    }
    if (map.getZoom() >= minZoomForAddressPoints && added === false) {
      municipalityLayerGroups.forEach((layerGroup) => {
        map.addLayer(layerGroup);
      });
      added = true;
    }
  };
};

let polyline: Polyline;

export const centerLeafletMapOnMarker = (
  map: Map,
  marker: CircleMarkerWithSchool
) => {
  if (map === null || !marker.school) {
    return;
  }
  var latLngs = [marker.getLatLng(), marker.school.getLatLng()];
  var markerBounds = L.latLngBounds(latLngs);
  map.once("moveend", function () {
    selectMarker(marker);
    if (polyline) {
      polyline.remove();
    }
    polyline = L.polyline(latLngs, { color: "red", dashArray: "10, 10" }).addTo(
      map
    );
    marker.bringToFront();
    if (marker.school) {
      marker.school.bringToFront();
      marker.school.openPopup();
    }
  });
  map.fitBounds(markerBounds, { padding: [150, 150] });
};

let selectedMarker: CircleMarkerWithSchool;
let selectedMarkerOriginalColor: string;

const selectMarker = (marker: CircleMarkerWithSchool) => {
  if (selectedMarker) {
    selectedMarker
      .setRadius(markerRadius)
      .setStyle({ weight: markerWeight, color: selectedMarkerOriginalColor });
  }
  selectedMarker = marker;
  selectedMarkerOriginalColor = marker.options.color || selectedMarkerColor;
  selectedMarker
    .setRadius(selectedMarkerRadius)
    .setStyle({ weight: selectedMarkerWeight, color: selectedMarkerColor });
};

export const createSvgIcon = (color: string): L.DivIcon => {
  return L.divIcon({
    html: `
  <svg
    width="24"
    height="24"
    viewBox="0 0 100 100"
    version="1.1"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M0 0 L50 100 L100 0 Z" fill="${color}"></path>
  </svg>`,
    className: "svg-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
};

export const loadMunicipalitiesByCityCodes = async (
  cityCodes: number[]
): Promise<MunicipalitiesByCityCodes | null> => {
  const response = await fetch("/api/map/municipalities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cityCodes }),
  });

  if (response.ok) {
    const { municipalitiesByCityCodes } = (await response.json()) as {
      municipalitiesByCityCodes: MunicipalitiesByCityCodes;
    };
    return municipalitiesByCityCodes;
  } else {
    console.error("Error while loading municipalities");
    return null;
  }
};