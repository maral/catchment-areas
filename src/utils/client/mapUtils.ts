import {
  AddressLayerGroup,
  AddressMarkerMap,
  AddressesLayerGroup,
  DataForMap,
  DataForMapByCityCodes,
  MapOptions,
  MarkerWithSchools,
  SchoolLayerGroup,
  SchoolMarker,
  SchoolMarkerMap,
  isPopupWithMarker,
} from "@/types/mapTypes";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import {
  Feature,
  FeatureCollection,
  MultiPolygon,
  Polygon,
} from "@turf/helpers";
import L, {
  Circle,
  FeatureGroup,
  Map as LeafletMap,
  Polyline,
  PopupEvent,
} from "leaflet";
import { createMarkers, wholeMunicipalityColor } from "./markers";
import { data } from "cheerio/lib/api/attributes";

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
): LeafletMap => {
  const map = L.map(element, {
    renderer: L.canvas({ padding: 0.5 }),
    zoomControl: false,
  });
  if (showControls) {
    L.control.zoom({ position: "bottomright" }).addTo(map);
  }
  L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
  }).addTo(map);

  return map;
};

let lastListener: () => void;

export const setupPopups = (map: LeafletMap): void => {
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
    resetAllHighlights(true);
  });
};

const setUpSchoolMarkersEvents = (
  schoolMarkers: SchoolMarkerMap,
  polygonLayers: L.GeoJSON[]
) => {
  Object.entries(schoolMarkers).forEach(([schoolIzo, marker]) => {
    marker.on("click", function (e) {
      // check polygonLayer is currently visible
      if (!(polygonLayers[0] as any)._map) {
        return;
      }
      resetAllHighlights();
      schoolHighlighted = true;
      lastPolygonLayers = polygonLayers;
      for (const polygonLayer of polygonLayers) {
        // when we click on a school marker, we want to hide all other polygons
        // leave only the one that is related to the school
        polygonLayer.getLayers().forEach((_layer) => {
          const layer = _layer as L.Polygon & {
            feature: Feature<Polygon | MultiPolygon>;
          };
          if (layer.feature.properties?.schoolIzo !== schoolIzo) {
            layer.setStyle({
              fillOpacity: 0.1,
              opacity: 0.3,
              fillColor: "#888",
            });
            layer.bringToBack();
          } else {
            const map = (polygonLayer as any)._map;
            map.flyToBounds(layer.getBounds(), { duration: 0.7 });
            layer.setStyle({ color: layer.options.fillColor });
          }
        });
      }
      selectSchool(marker);
    });
  });
};

let polylines: Polyline[];
let selectedSchools = new Set<Circle>();
let lastPolygonLayers: L.GeoJSON[] | undefined;
let schoolHighlighted = false;
let addressHighlighted = false;

const isSomethingHighlighted = () => {
  return schoolHighlighted || addressHighlighted;
};

export const resetAllHighlights = (exceptPolygonHighlights = false) => {
  if (!isSomethingHighlighted() && exceptPolygonHighlights) {
    return;
  }
  if (lastPolygonLayers) {
    lastPolygonLayers.forEach((l) => l.resetStyle());
    lastPolygonLayers = undefined;
  }
  if (polylines) {
    polylines.forEach((p) => p.remove());
  }
  selectedSchools.forEach(deselectSchool);
  schoolHighlighted = false;
  addressHighlighted = false;
};

export const centerLeafletMapOnMarker = (
  map: LeafletMap,
  marker: MarkerWithSchools
) => {
  if (map === null || !marker.schools || marker.schools.length === 0) {
    return;
  }
  const latLngs = [
    marker.getLatLng(),
    ...marker.schools.map((m) => m.getLatLng()),
  ];
  const markerBounds = L.latLngBounds(latLngs);
  resetAllHighlights();
  addressHighlighted = true;
  polylines = [];
  marker.schools.forEach((school) => {
    polylines.push(
      L.polyline([marker.getLatLng(), school.getLatLng()], {
        color: "red",
        dashArray: "10, 10",
      })
        .addTo(map)
        .bringToBack()
    );

    selectSchool(school);
  });
  map.once("moveend", function () {});
  map.flyToBounds(markerBounds, { padding: [150, 150], duration: 0.7 });
};

const selectSchool = (school: SchoolMarker) => {
  school.setStyle({ color: selectedMarkerColor });
  const tooltip = school.getTooltip()!;
  school.unbindTooltip();
  tooltip.options.permanent = true;
  school.bindTooltip(tooltip);
  selectedSchools.add(school);
};

const deselectSchool = (school: SchoolMarker) => {
  school.setStyle({ color: school.options.fillColor });
  const tooltip = school.getTooltip()!;
  school.unbindTooltip();
  tooltip.options.permanent = false;
  school.bindTooltip(tooltip);
  selectedSchools.delete(school);
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
  options = {},
}: {
  data: DataForMap;
  lines?: string[];
  options?: MapOptions;
  cityCode?: string;
}): {
  addressesLayerGroup: AddressLayerGroup;
  schoolsLayerGroup: SchoolLayerGroup;
  polygonLayerGroup: FeatureGroup;
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
  const schoolColorIndicesMap: Record<string, number> = {};

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
    schoolColorIndicesMap,
    options,
    lines
  );

  const wholeMunicipalityInfo = getWholeMunicipalityInfo(data);
  const allFeatures = Object.values(data.polygons)
    .flatMap((polygon) => polygon.features)
    .filter(
      (feature) =>
        !wholeMunicipalityInfo.ignoredSchoolIzos.has(
          feature.properties?.schoolIzo
        )
    );
  const monsterCollection: FeatureCollection = {
    type: "FeatureCollection",
    features: allFeatures,
  };
  const polygonLayers = [monsterCollection].map((polygon) =>
    createPolygonLayer(
      polygon,
      schoolMarkers,
      schoolColorIndicesMap,
      wholeMunicipalityInfo,
      options
    )
  );

  setUpSchoolMarkersEvents(schoolMarkers, polygonLayers);

  const polygonLayerGroup = L.featureGroup(polygonLayers);

  return {
    addressesLayerGroup,
    schoolsLayerGroup,
    polygonLayerGroup,
    unmappedLayerGroup,
    municipalityLayerGroups,
    addressMarkers,
  };
};

type WholeMunicipalityInfo = {
  wholeMunicipalitySchoolIzos: Map<string, string[]>;
  ignoredSchoolIzos: Set<string>;
};

const getWholeMunicipalityInfo = (data: DataForMap): WholeMunicipalityInfo => {
  const info = {
    wholeMunicipalitySchoolIzos: new Map<string, string[]>(),
    ignoredSchoolIzos: new Set<string>(),
  };

  for (const municipality of data.municipalities) {
    const wholeMunicipalitySchools = municipality.schools.filter(
      (school) => school.isWholeMunicipality
    );

    if (wholeMunicipalitySchools.length > 0) {
      const ignoredIzos = wholeMunicipalitySchools
        .slice(1)
        .map((school) => school.izo);
      info.wholeMunicipalitySchoolIzos.set(
        wholeMunicipalitySchools[0].izo,
        ignoredIzos
      );
      ignoredIzos.forEach((izo) => {
        info.ignoredSchoolIzos.add(izo);
      });
    }
  }

  return info;
};

const createPolygonLayer = (
  polygon: FeatureCollection,
  schoolMarkers: SchoolMarkerMap,
  schoolColorIndicesMap: Record<string, number>,
  wholeMunicipalityInfo: WholeMunicipalityInfo,
  options: MapOptions
) => {
  const geoJsonLayer: L.GeoJSON = L.geoJSON(polygon, {
    pane: "overlayPane",
    style: (feature) => {
      const isWholeMunicipality =
        feature &&
        wholeMunicipalityInfo.wholeMunicipalitySchoolIzos.has(
          feature.properties.schoolIzo
        );
      return feature
        ? {
            fillColor:
              options.color ?? isWholeMunicipality
                ? wholeMunicipalityColor
                : feature?.properties.colorIndex === -1
                ? unmappedPolygonColor
                : colors[
                    schoolColorIndicesMap[feature.properties.schoolIzo] %
                      colors.length
                  ],
            color: "#777",
            weight: 2,
            fillOpacity: isWholeMunicipality ? 0.15 : 0.4,
          }
        : {};
    },
    bubblingMouseEvents: false,
  })
    .on("mouseout", (e) =>
      handleMouseMove(schoolMarkers, wholeMunicipalityInfo, geoJsonLayer, e)
    )
    .on("mousemove", (e) =>
      handleMouseMove(schoolMarkers, wholeMunicipalityInfo, geoJsonLayer, e)
    );
  return geoJsonLayer;
};

const handleMouseMove = (
  schoolMarkers: SchoolMarkerMap,
  wholeMunicipalityInfo: WholeMunicipalityInfo,
  geoJsonLayer: L.GeoJSON,
  e: L.LeafletMouseEvent
) => {
  if (isSomethingHighlighted()) {
    return;
  }

  const relatedSchoolMarkers = geoJsonLayer
    .getLayers()
    .flatMap((layer) => {
      const feature: Feature<Polygon | MultiPolygon> = (layer as any).feature;
      if (booleanPointInPolygon([e.latlng.lng, e.latlng.lat], feature)) {
        const markers = [schoolMarkers[feature.properties?.schoolIzo]];
        if (
          wholeMunicipalityInfo.wholeMunicipalitySchoolIzos.has(
            feature.properties?.schoolIzo
          )
        ) {
          markers.push(
            ...(wholeMunicipalityInfo.wholeMunicipalitySchoolIzos
              .get(feature.properties?.schoolIzo)
              ?.map((izo) => schoolMarkers[izo]) ?? [])
          );
        }
        return markers;
      }
    })
    .filter((marker) => marker !== undefined) as L.Circle[];

  // add all new schools
  relatedSchoolMarkers.forEach((marker) => {
    if (!selectedSchools.has(marker)) {
      selectSchool(marker);
    }
  });

  // remove all selected schools that are no longer hovered over
  selectedSchools.forEach((marker) => {
    if (!relatedSchoolMarkers.includes(marker)) {
      deselectSchool(marker);
    }
  });
};
