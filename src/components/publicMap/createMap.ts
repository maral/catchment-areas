import { CityOnMap, MunicipalitiesByCityCodes } from "@/types/mapTypes";
import {
  createSvgIcon,
  loadMunicipalitiesByCityCodes,
  prepareMap,
  setupPopups,
} from "@/utils/client/mapUtils";
import L, { Map, Marker } from "leaflet";
import debounce from "lodash/debounce";

let markers: Record<string, Marker> = {};
let citiesMap: Record<string, CityOnMap> = {};
let map: Map;
let mapInitialized = false;

export const createMap = (
  element: HTMLElement,
  cities: CityOnMap[],
  showControls: boolean = true
): (() => void) => {
  if (!element || mapInitialized) {
    return () => null;
  }

  map = prepareMap(element, showControls);
  mapInitialized = true;

  const bounds = L.latLngBounds([]);
  const publicIcon = createSvgIcon("#03b703");
  const notReadyIcon = createSvgIcon("#999");

  cities.forEach((city) => {
    const marker = L.marker([city.lat, city.lng], {
      icon: city.hasPublicOrdinance ? publicIcon : notReadyIcon,
    })
      .bindPopup(
        city.name +
          (city.hasPublicOrdinance ? " ✅" : " - zatím není připraveno")
      )
      .addTo(map);
    markers[city.code] = marker;
    citiesMap[city.code] = city;
    bounds.extend(marker.getLatLng());
  });

  setupPopups(map);

  map.fitBounds(bounds);

  const zoomEndHandler = createPublicMoveAndZoomEndHandler(
    map,
    markers,
    citiesMap
  );
  map.on("zoom", zoomEndHandler);
  map.on("move", zoomEndHandler);
  zoomEndHandler();

  return () => {
    map.remove();
    mapInitialized = false;
  };
};

const minZoomForLoadingCities = 11;
const loadedCities: MunicipalitiesByCityCodes = {};

const createPublicMoveAndZoomEndHandler = (
  map: Map,
  cityMarkers: Record<string, Marker>,
  citiesMap: Record<string, CityOnMap>
) => {
  return debounce(async () => {
    console.log(map.getZoom());
    if (map.getZoom() >= minZoomForLoadingCities) {
      const bounds = getCurrentBounds(map);

      const citiesInViewport: CityOnMap[] = [];
      for (let id in cityMarkers) {
        let marker = cityMarkers[id];

        // Check if the marker is in the current map bounds
        if (bounds.contains(marker.getLatLng())) {
          citiesInViewport.push(citiesMap[id]);
        }
      }

      const newCities = citiesInViewport.filter(
        (c) => !(c.code in loadedCities)
      );
      console.log(newCities.map((c) => c.name));

      const result: MunicipalitiesByCityCodes = {};
      for (const city of newCities) {
        result[city.code] = [];
      }
      // await loadMunicipalitiesByCityCodes(
      //   newCities.map((c) => c.code)
      // );

      if (result) {
        Object.assign(loadedCities, result);
      }
    }

    // if (map.getZoom() < minZoomForAddressPoints && added === true) {
    //   municipalityLayerGroups.forEach((layerGroup) => {
    //     map.removeLayer(layerGroup);
    //   });
    //   added = false;
    // }
    // if (map.getZoom() >= minZoomForAddressPoints && added === false) {
    //   municipalityLayerGroups.forEach((layerGroup) => {
    //     map.addLayer(layerGroup);
    //   });
    //   added = true;
    // }
  }, 300);
};

// The rectangle size
const widthKm = 54;
const heightKm = 30;

// Approximate km per degree
const kmPerLatDegree = 111;
const kmPerLngDegree = 73;

const latChange = heightKm / kmPerLatDegree;
const lngChange = widthKm / kmPerLngDegree;

const getCurrentBounds = (map: Map) => {
  const center = map.getCenter();

  const topLeftLatLng = L.latLng(
    center.lat + latChange / 2,
    center.lng - lngChange / 2
  );
  const bottomRightLatLng = L.latLng(
    center.lat - latChange / 2,
    center.lng + lngChange / 2
  );

  return L.latLngBounds(topLeftLatLng, bottomRightLatLng);
};
