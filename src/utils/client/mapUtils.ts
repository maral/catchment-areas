import {
  AddressLayerGroup,
  AddressesLayerGroup,
  MarkerMap,
  MarkerWithSchools,
  MunicipalitiesByCityCodes,
  PopupWithMarker,
  SchoolLayerGroup,
  SchoolMarker,
  isPopupWithMarker,
} from "@/types/mapTypes";
import L, { Circle, LatLngBounds, Map, Polyline, PopupEvent } from "leaflet";
import { ExportAddressPoint, Municipality, School } from "text-to-map";

export const colors = [
  "d33d81",
  "0ea13b",
  "0082ad",
  "f17b5a",
  "c45a18",
  "2bc6d9",
  "c686d0",
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
    resetCenteredMarker();
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

export const resetCenteredMarker = () => {
  deselectMarker();
  if (polylines) {
    polylines.forEach((p) => p.remove());
  }
  selectedSchools.forEach((school) => {
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
  if (map === null || !marker.schools) {
    return;
  }
  const latLngs = [
    marker.getLatLng(),
    ...marker.schools.map((m) => m.getLatLng()),
  ];
  const markerBounds = L.latLngBounds(latLngs);
  map.once("moveend", function () {
    resetCenteredMarker();
    selectMarker(marker);
    polylines = [];
    marker.schools?.forEach((school) => {
      const schoolLatLngs = [marker.getLatLng(), school.getLatLng()];
      polylines.push(
        L.polyline(schoolLatLngs, { color: "red", dashArray: "10, 10" }).addTo(
          map
        )
      );

      const tooltip = school.getTooltip()!;
      school.unbindTooltip();
      tooltip.options.permanent = true;
      school.bindTooltip(tooltip);
      selectedSchools.push(school);
    });
  });
  map.fitBounds(markerBounds, { padding: [150, 150] });
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

const markers: MarkerMap = {};

export const createCityLayers = (
  municipalities: Municipality[],
  cityCode?: string
): {
  bounds: LatLngBounds;
  addressesLayerGroup: AddressLayerGroup;
  schoolsLayerGroup: SchoolLayerGroup;
  layerGroupsForControl: { [key: string]: SchoolLayerGroup };
  municipalityLayerGroups: AddressLayerGroup[];
} => {
  const bounds = L.latLngBounds([]);
  const addressesLayerGroup: AddressesLayerGroup = L.layerGroup();
  const schoolsLayerGroup: SchoolLayerGroup = L.layerGroup();
  const layerGroupsForControl: { [key: string]: SchoolLayerGroup } = {};
  const municipalityLayerGroups: AddressLayerGroup[] = [];

  addressesLayerGroup.cityCode = cityCode;
  addressesLayerGroup.type = "addresses";
  schoolsLayerGroup.cityCode = cityCode;
  schoolsLayerGroup.type = "schools";

  let colorIndex = 0;

  const markersToCreate: Record<
    string,
    { point: ExportAddressPoint; schools: School[] }
  > = {};
  const schoolColors: Record<string, string> = {};
  const addressLayerGroups: Record<string, AddressLayerGroup> = {};

  municipalities.forEach((municipality) => {
    let layerGroup: AddressLayerGroup = L.layerGroup();
    layerGroupsForControl[municipality.municipalityName] = layerGroup;
    municipalityLayerGroups.push(layerGroup);
    addressesLayerGroup.addLayer(layerGroup);
    municipality.schools.forEach((school) => {
      const color = `#${colors[colorIndex % colors.length]}`;
      const schoolMarker = createSchoolMarker(school, color).addTo(
        schoolsLayerGroup
      );
      bounds.extend(schoolMarker.getLatLng());

      schoolColors[school.izo] = color;
      addressLayerGroups[school.izo] = layerGroup;
      markers[school.name] = schoolMarker;

      // first put the address points' schools together, add them later
      school.addresses.forEach((point) => {
        if (!point.lat || !point.lng) {
          return;
        }

        if (point.address in markersToCreate) {
          markersToCreate[point.address].schools.push(school);
        } else {
          markersToCreate[point.address] = {
            point,
            schools: [school],
          };
        }
      });

      colorIndex++;
    });
  });

  Object.values(markersToCreate).forEach(({ point, schools }) => {
    const colors = schools.map((school) => schoolColors[school.izo]);
    const newMarkers = createAddressMarker(
      point,
      colors,
      schools.map((s) => markers[s.name]) as SchoolMarker[]
    );
    newMarkers.forEach((marker) => {
      addressLayerGroups[schools[0].izo].addLayer(marker);
      markers[point.address] = marker;
      bounds.extend(marker.getLatLng());
    });
  });

  return {
    bounds,
    addressesLayerGroup,
    schoolsLayerGroup,
    layerGroupsForControl,
    municipalityLayerGroups,
  };
};

const defaultPosition = [49.19506, 16.606837];

const createSchoolMarker = (school: School, color: string) => {
  const schoolTooltip = L.tooltip({
    direction: "top",
    content: `<div style="text-align: center;">${school.name
      .split(", ")
      .join(",<br>")}</div>`,
  });
  return L.circle(
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
  ).bindTooltip(schoolTooltip);
};

const createAddressMarker = (
  point: ExportAddressPoint,
  colors: string[],
  schoolMarkers: SchoolMarker[]
) => {
  const markers = createMarkerByColorCount(point, colors);
  markers.forEach((marker) => {
    const popup: PopupWithMarker = Object.assign(
      L.popup().setContent(`
    <div>
      ${point.address}
      <div class="text-center mt-2"><button class="border rounded px-2 py-1 text-xs bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-700 marker-button">
        Zobrazit spádovou školu    
      </button></div>
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
