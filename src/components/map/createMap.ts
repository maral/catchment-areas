import L, {
  Polyline,
  Map as LeafletMap,
  LayerGroup,
  CircleMarker,
  LatLngBounds,
  PopupEvent,
  Popup,
} from "leaflet";
import { Municipality, School } from "text-to-map";

const colors = [
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

interface CircleMarkerWithSchool extends CircleMarker {
  school?: CircleMarkerWithSchool;
}

interface PopupWithMarker extends Popup {
  marker: CircleMarkerWithSchool;
}

const isPopupWithMarker = (popup: Popup): popup is PopupWithMarker => {
  return popup.hasOwnProperty("marker");
};

type MarkerMap = { [key: string]: CircleMarkerWithSchool };
type AddressLayerGroup = LayerGroup<CircleMarkerWithSchool>;
type SchoolLayerGroup = LayerGroup<CircleMarker>;

let _municipalities: Municipality[];
let markers: MarkerMap = {};
let map: LeafletMap;
let selectedMarker: CircleMarkerWithSchool;
let selectedMarkerOriginalColor: string;
let polyline: Polyline;
let lastListener: () => void;
const markerRadius = 4;
const markerWeight = 2;
const selectedMarkerRadius = 8;
const selectedMarkerWeight = 5;
const minZoomForAddressPoints = 16;
const emptyCallback = () => null;
const selectedMarkerColor = "#ffff00";

export const createMap = (
  element: HTMLElement,
  municipalities: Municipality[],
  center?: [number, number],
  zoom?: number,
  showControls: boolean = true,
  color?: string
): (() => void) => {
  if (!element || map) {
    return emptyCallback;
  }

  _municipalities = municipalities;

  map = prepareMap(element, showControls);

  const municipalityLayerGroups: AddressLayerGroup[] = [];
  const layerGroupsForControl: { [key: string]: SchoolLayerGroup } = {};
  const schoolsLayerGroup: SchoolLayerGroup = L.layerGroup().addTo(map);
  layerGroupsForControl["Školy"] = schoolsLayerGroup;
  const bounds = L.latLngBounds([]);

  let colorIndex = 0;
  municipalities.forEach((municipality) => {
    let layerGroup: AddressLayerGroup = L.layerGroup();
    layerGroupsForControl[municipality.municipalityName] = layerGroup;
    municipalityLayerGroups.push(layerGroup);
    municipality.schools.forEach((school) => {
      createSchoolMarkers(
        school,
        color ? color : `#${colors[colorIndex % colors.length]}`,
        schoolsLayerGroup,
        layerGroup,
        markers,
        bounds
      );
      colorIndex++;
    });
    municipalities;
  });

  map.on("popupopen", function (e: PopupEvent) {
    const popup = e.popup;
    if (isPopupWithMarker(popup)) {
      lastListener = () => {
        centerLeafletMapOnMarker(popup.marker);
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

  if (center) {
    map.setView(center, zoom ?? 15);
  } else {
    map.fitBounds(bounds);
    if (zoom) {
      map.setZoom(zoom);
    }
  }

  if (municipalities.length > 1 && showControls) {
    L.control.layers(undefined, layerGroupsForControl).addTo(map);
  } else if (municipalities.length === 1) {
    map.addLayer(municipalityLayerGroups[0]);
  }

  const zoomEndHandler = createZoomEndHandler(map, municipalityLayerGroups);
  map.on("zoomend", zoomEndHandler);
  zoomEndHandler();
  return () => {
    map.remove();
  };
};

const prepareMap = (
  element: HTMLElement,
  showControls: boolean
): LeafletMap => {
  const map = L.map(element, {
    renderer: L.canvas({ padding: 0.5 }),
    zoomControl: showControls,
  });
  // L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
  //   attribution:
  //     '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
  // }).addTo(map);
  L.tileLayer(
    "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    }
  ).addTo(map);

  return map;
};

const defaultPosition = [49.19506, 16.606837];

const createSchoolMarkers = (
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

const createZoomEndHandler = (
  map: LeafletMap,
  municipalityLayerGroups: AddressLayerGroup[]
) => {
  if (municipalityLayerGroups.length <= 1) {
    return emptyCallback;
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

const centerLeafletMapOnMarker = (marker: CircleMarkerWithSchool) => {
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
