import {
  AddressLayerGroup,
  AddressesLayerGroup,
  DataForMap,
  DataForMapByCityCodes,
  SchoolMarkerMap,
  MarkerWithSchools,
  PopupWithMarker,
  SchoolLayerGroup,
  SchoolMarker,
  isPopupWithMarker,
} from "@/types/mapTypes";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { Feature, MultiPolygon, Polygon } from "@turf/helpers";
import L, { Circle, Map, Polyline, PopupEvent, polygon } from "leaflet";
import { ExportAddressPoint, School } from "text-to-map";

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

const unmappedMarkerColor = "#ff0000";
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

          map.fitBounds(layer.getBounds());
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

const centerLeafletMapOnMarker = (map: Map, marker: MarkerWithSchools) => {
  map.once("moveend", function () {
    selectMarker(marker);
  });
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
  map.fitBounds(markerBounds, { padding: [150, 150] });
};

const selectSchool = (school: SchoolMarker) => {
  const tooltip = school.getTooltip()!;
  school.unbindTooltip();
  tooltip.options.permanent = true;
  school.bindTooltip(tooltip);
  selectedSchools.push(school);
};

let selectedMarker: MarkerWithSchools | undefined;
let selectedMarkerOriginalColor: string;

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
    //   .setStyle({ weight: markerWeight, color: selectedMarkerOriginalColor });
  }
  selectedMarker = undefined;
};

export const rotatePointOnCircle = (
  x: number,
  y: number,
  r: number,
  degrees: number,
  xCoefficient = 1,
  yCoefficient = 1
): [number, number] => {
  const radians = (degrees * Math.PI) / 180;
  const newX = x + r * Math.sin(radians) * xCoefficient;
  const newY = y - r * Math.cos(radians) * yCoefficient;
  return [newX, newY];
};

const flip = ([x, y]: [number, number]): [number, number] => {
  return [y, x];
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
} => {
  const addressesLayerGroup: AddressesLayerGroup = L.layerGroup(undefined, {
    pane: "markerPane",
  });
  const schoolsLayerGroup: SchoolLayerGroup = L.layerGroup();
  const municipalityLayerGroups: AddressLayerGroup[] = [];
  const schoolMarkers: SchoolMarkerMap = {};

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

const createMarkers = (
  data: DataForMap,
  municipalityLayerGroups: AddressLayerGroup[],
  addressesLayerGroup: AddressesLayerGroup,
  schoolsLayerGroup: SchoolLayerGroup,
  unmappedLayerGroup: AddressLayerGroup,
  schoolMarkers: SchoolMarkerMap,
  showDebugInfo: boolean,
  lines?: string[]
) => {
  let colorIndex = 0;
  const markersToCreate: Record<
    string,
    { point: ExportAddressPoint; schools: School[] }
  > = {};
  const schoolColors: Record<string, string> = {};
  const addressLayerGroupsMap: Record<string, AddressLayerGroup> = {};

  data.municipalities.forEach((municipality) => {
    const layerGroup: AddressLayerGroup = L.layerGroup();
    municipalityLayerGroups.push(layerGroup);
    addressesLayerGroup.addLayer(layerGroup);
    municipality.schools.forEach((school) => {
      const color = colors[colorIndex % colors.length];
      const schoolMarker = createSchoolMarker(school, color).addTo(
        schoolsLayerGroup
      );

      schoolColors[school.izo] = color;
      addressLayerGroupsMap[school.izo] = layerGroup;
      schoolMarkers[school.izo] = schoolMarker;

      // first put the address points' schools together, add them later
      school.addresses.forEach((point) => {
        if (!point.lat || !point.lng) {
          return;
        }

        if (point.address in markersToCreate) {
          markersToCreate[point.address].schools.push(school);
          markersToCreate[point.address].point.lineNumbers?.push(
            ...(point.lineNumbers ?? [])
          );
        } else {
          markersToCreate[point.address] = {
            point,
            schools: [school],
          };
        }
      });

      colorIndex++;
    });

    if (showDebugInfo) {
      municipality.unmappedPoints.forEach((point) => {
        markersToCreate[point.address] = {
          point,
          schools: [],
        };
      });
    }
  });

  Object.values(markersToCreate).forEach(({ point, schools }) => {
    const colors =
      schools.length === 0
        ? [unmappedMarkerColor]
        : schools.map((school) => schoolColors[school.izo]);
    const newMarkers = createAddressMarker(
      point,
      colors,
      schools.map((s) => schoolMarkers[s.izo]) as SchoolMarker[],
      showDebugInfo && schools.length > 0,
      lines
    );
    newMarkers.forEach((marker) => {
      if (schools.length === 0) {
        unmappedLayerGroup.addLayer(marker);
      } else {
        addressLayerGroupsMap[schools[0].izo].addLayer(marker);
      }
    });
  });
};

const defaultPosition = [49.19506, 16.606837];

const createSchoolMarker = (school: School, color: string) => {
  const schoolTooltip = L.tooltip({
    direction: "top",
    content: `<div style="text-align: center;">${school.name}</div>`,
  });
  return L.circle(
    [
      school.position?.lat ?? defaultPosition[0],
      school.position?.lng ?? defaultPosition[1],
    ],
    {
      radius: 19,
      fill: true,
      fillColor: color,
      fillOpacity: 1,
      weight: 4,
      color,
      bubblingMouseEvents: false,
    }
  ).bindTooltip(schoolTooltip);
};

const createAddressMarker = (
  point: ExportAddressPoint,
  colors: string[],
  schoolMarkers: SchoolMarker[],
  showDebugInfo: boolean,
  lines?: string[]
) => {
  const markers = createMarkerByColorCount(point, colors);
  markers.forEach((marker) => {
    const popup: PopupWithMarker = Object.assign(
      L.popup().setContent(`
    <div>
      ${point.address}

      ${
        showDebugInfo
          ? `<br><br><em>${point.lineNumbers
              ?.map((line) => `řádek ${line + 1}: ${lines?.[line]}`)
              .join("<br>")}</em>`
          : ""
      }

      ${
        schoolMarkers.length > 0
          ? `
            <div class="text-center mt-2"><button class="border rounded px-2 py-1 text-xs bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-700 marker-button">
              Zobrazit spádovou školu    
            </button></div>`
          : "<br><br><em>Adresní místo bez spádové školy</em>"
      }
    </div>`),
      { marker: marker }
    );
    marker.bindPopup(popup);
    marker.schools = schoolMarkers;
  });
  return markers;
};

const createMarkerByColorCount = (
  point: ExportAddressPoint,
  colors: string[]
): MarkerWithSchools[] => {
  if (colors.length > 1) {
    const angle = 360 / colors.length;
    return colors.map((color, index) =>
      L.circle(
        flip(
          rotatePointOnCircle(
            point.lng,
            point.lat,
            0.00005,
            angle * index,
            1,
            0.7
          )
        ),
        {
          radius: markerRadius,
          fill: true,
          fillColor: color,
          fillOpacity: 1,
          weight: markerWeight,
          color: color,
        }
      )
    );
  } else {
    return [
      L.circle([point.lat, point.lng], {
        radius: markerRadius,
        fill: true,
        fillColor: colors[0],
        fillOpacity: 1,
        weight: markerWeight,
        color: colors[0],
      }),
    ];
  }
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
