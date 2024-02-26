import {
  AddressLayerGroup,
  AddressMarkerMap,
  AddressesLayerGroup,
  DataForMap,
  DataForMapByCityCodes,
  MarkerWithSchools,
  SchoolLayerGroup,
  SchoolMarker,
  SchoolMarkerMap,
  isPopupWithMarker,
} from "@/types/mapTypes";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { Feature, MultiPolygon, Polygon } from "@turf/helpers";
import L, { Circle, Map, Polyline, PopupEvent } from "leaflet";
import { createMarkers } from "./markers";

export const colors = [
  "#d33d81",
  "#0ea13b",
  "#0082ad",
  "#f17b5a",
  "#c45a18",
  "#2bc6d9",
  "#c686d0",
  "#81b2e9",
  "#6279bd",
];

const unmappedPolygonColor = "#888888";

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
    resetAllHighlights();
    const popup = e.popup;
    if (isPopupWithMarker(popup)) {
      lastListener = () => {
        centerLeafletMapOnMarker(map, popup.marker);
      };
      const button =
        // @ts-ignore not ideal but unfortunately not other way to get the button
        e.popup._source._popup._contentNode.querySelector(".marker-button");
      if (button) {
        button.addEventListener("click", lastListener);
      }
    }
  });

  map.on("popupclose", function (e: PopupEvent) {
    const popup = e.popup;
    if (isPopupWithMarker(popup) && lastListener) {
      const button =
        // @ts-ignore
        e.popup._source._popup._contentNode.querySelector(".marker-button");
      if (button) {
        button.removeEventListener("click", lastListener);
      }
    }
    resetAllHighlights();
  });

  map.on("click", function () {
    resetAllHighlights();
  });
};

const setUpSchoolMarkersEvents = (
  schoolMarkers: SchoolMarkerMap,
  polygonLayer: L.GeoJSON
) => {
  Object.entries(schoolMarkers).forEach(([schoolIzo, marker]) => {
    marker.on("click", function (e) {
      // check polygonLayer is currently visible
      if (!(polygonLayer as any)._map) {
        return;
      }
      resetAllHighlights();
      lastPolygonLayer = polygonLayer;
      // when we click on a school marker, we want to hide all other polygons
      // leave only the one that is related to the school
      polygonLayer.getLayers().forEach((_layer) => {
        const layer = _layer as L.Polygon & {
          feature: Feature<Polygon | MultiPolygon>;
        };
        if (layer.feature.properties?.schoolIzo !== schoolIzo) {
          layer.setStyle({ fillOpacity: 0.1, opacity: 0.3, fillColor: "#888" });
        } else {
          const map = (polygonLayer as any)._map;

          map.flyToBounds(layer.getBounds(), { duration: 0.7 });
        }
        selectSchool(marker);
      });
    });
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

let polylines: Polyline[];
let selectedSchools: Circle[] = [];
let lastPolygonLayer: L.GeoJSON | undefined;

export const resetAllHighlights = () => {
  if (lastPolygonLayer) {
    lastPolygonLayer.resetStyle();
  }
  deselectMarker();
  if (polylines) {
    polylines.forEach((p) => p.remove());
  }
  selectedSchools.forEach((school) => {
    school.setStyle({ color: school.options.fillColor });
    const tooltip = school.getTooltip()!;
    school.unbindTooltip();
    tooltip.options.permanent = false;
    school.bindTooltip(tooltip);
  });
  selectedSchools = [];
};

export const centerLeafletMapOnMarker = (
  map: Map,
  marker: MarkerWithSchools
) => {
  map.once("moveend", () => selectMarker(marker));
  _centerLeafletMapOnPoint(map, marker.getLatLng(), marker.schools);
};

const centerLeafletMapOnPoint = (
  map: Map,
  point: L.LatLng,
  schools: L.Circle[] | undefined
) => {
  _centerLeafletMapOnPoint(map, point, schools);
};

const _centerLeafletMapOnPoint = (
  map: Map,
  point: L.LatLng,
  schools: L.Circle[] | undefined
) => {
  if (map === null || !schools || schools.length === 0) {
    return;
  }
  const latLngs = [point, ...schools.map((m) => m.getLatLng())];
  const markerBounds = L.latLngBounds(latLngs);
  resetAllHighlights();
  polylines = [];
  schools?.forEach((school) => {
    school.setStyle({ color: selectedMarkerColor });
    const schoolLatLngs = [point, school.getLatLng()];
    polylines.push(
      L.polyline(schoolLatLngs, { color: "red", dashArray: "10, 10" }).addTo(
        map
      )
    );

    selectSchool(school);
  });
  map.once("moveend", function () {});
  map.flyToBounds(markerBounds, { padding: [150, 150], duration: 0.7 });
};

const selectSchool = (school: SchoolMarker) => {
  const tooltip = school.getTooltip()!;
  school.unbindTooltip();
  tooltip.options.permanent = true;
  school.bindTooltip(tooltip);
  selectedSchools.push(school);
};

let selectedMarker: MarkerWithSchools | undefined;

const selectMarker = (marker: MarkerWithSchools) => {
  deselectMarker();
  selectedMarker = marker;
  // selectedMarkerOriginalColor = marker.options.color || selectedMarkerColor;
  // selectedMarker
  //   .setRadius(selectedMarkerRadius)
  //   .setStyle({ weight: selectedMarkerWeight, color: selectedMarkerColor });
};

const deselectMarker = () => {
  if (selectedMarker) {
    // selectedMarker
    //   .setRadius(markerRadius)
    //   .setStyle({ weight: markerWeight, color: selectedMarker.options.fillColor });
  }
  selectedMarker = undefined;
};

export const loadMunicipalitiesByCityCodes = async (
  cityCodes: number[]
): Promise<DataForMapByCityCodes | null> => {
  const response = await fetch("/api/map/municipalities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cityCodes }),
  });

  if (response.ok) {
    const { dataForMapByCityCodes } = (await response.json()) as {
      dataForMapByCityCodes: DataForMapByCityCodes;
    };
    return dataForMapByCityCodes;
  } else {
    console.error("Error while loading municipalities");
    return null;
  }
};

export const createCityLayers = ({
  data,
  cityCode,
  lines,
  showDebugInfo = false,
}: {
  data: DataForMap;
  lines?: string[];
  showDebugInfo?: boolean;
  cityCode?: string;
}): {
  addressesLayerGroup: AddressLayerGroup;
  schoolsLayerGroup: SchoolLayerGroup;
  polygonLayer: L.GeoJSON;
  unmappedLayerGroup: AddressLayerGroup;
  municipalityLayerGroups: AddressLayerGroup[];
  addressMarkers: AddressMarkerMap;
} => {
  const addressesLayerGroup: AddressesLayerGroup = L.layerGroup(undefined, {
    pane: "markerPane",
  });
  const schoolsLayerGroup: SchoolLayerGroup = L.featureGroup();
  const municipalityLayerGroups: AddressLayerGroup[] = [];
  const schoolMarkers: SchoolMarkerMap = {};
  const addressMarkers: AddressMarkerMap = {};

  addressesLayerGroup.cityCode = cityCode;
  addressesLayerGroup.type = "addresses";
  schoolsLayerGroup.cityCode = cityCode;
  schoolsLayerGroup.type = "schools";

  const unmappedLayerGroup: AddressLayerGroup = L.layerGroup();

  createMarkers(
    data,
    municipalityLayerGroups,
    addressesLayerGroup,
    schoolsLayerGroup,
    unmappedLayerGroup,
    schoolMarkers,
    addressMarkers,
    showDebugInfo,
    lines
  );

  const polygonLayer = createPolygonLayer(data, schoolMarkers);

  setUpSchoolMarkersEvents(schoolMarkers, polygonLayer);

  return {
    addressesLayerGroup,
    schoolsLayerGroup,
    polygonLayer,
    unmappedLayerGroup,
    municipalityLayerGroups,
    addressMarkers,
  };
};

const createPolygonLayer = (
  data: DataForMap,
  schoolMarkers: SchoolMarkerMap
) => {
  const geoJsonLayer = L.geoJSON(data.polygons, {
    pane: "overlayPane",
    style: (feature) => {
      return feature
        ? {
            fillColor:
              feature?.properties.colorIndex === -1
                ? unmappedPolygonColor
                : colors[feature.properties.colorIndex % colors.length],
            color: "#777",
            weight: 2,
            fillOpacity: 0.4,
          }
        : {};
    },
    bubblingMouseEvents: false,
  }).on("click", function (e) {
    const map = (geoJsonLayer as any)._map;
    const relatedSchoolMarkers = geoJsonLayer
      .getLayers()
      .map((layer) => {
        const feature: Feature<Polygon | MultiPolygon> = (layer as any).feature;
        if (booleanPointInPolygon([e.latlng.lng, e.latlng.lat], feature)) {
          return schoolMarkers[feature.properties?.schoolIzo];
        }
      })
      .filter((marker) => marker !== undefined) as L.Circle[];
    centerLeafletMapOnPoint(map, e.latlng, relatedSchoolMarkers);
  });
  return geoJsonLayer;
};
