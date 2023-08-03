import {
  CityOnMap,
  LoadedCitiesData,
  MunicipalitiesByCityCodes,
} from "@/types/mapTypes";
import {
  createCityLayers,
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

const publicIcon = createSvgIcon("#03b703");
const notReadyIcon = createSvgIcon("#999");

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

  cities.forEach((city) => addCityMarker(city, bounds));

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

const addCityMarker = (city: CityOnMap, bounds: L.LatLngBounds) => {
  const marker = L.marker([city.lat, city.lng], {
    icon: city.isPublished ? publicIcon : notReadyIcon,
  })
    .bindPopup(city.name + (city.isPublished ? "" : " - zatím není připraveno"))
    .addTo(map);
  marker.setZIndexOffset(city.isPublished ? 1000 : 900);
  markers[city.code] = marker;
  citiesMap[city.code] = city;
  bounds.extend(marker.getLatLng());
};

const minZoomForLoadingCities = 11;
const minZoomForAddressPoints = 13;
const loadedCities: LoadedCitiesData = {};
const citiesWithShownSchools = new Set<number>();
const citiesWithShownAddresses = new Set<number>();

const createPublicMoveAndZoomEndHandler = (
  map: Map,
  cityMarkers: Record<string, Marker>,
  citiesMap: Record<string, CityOnMap>
) => {
  return debounce(async () => {
    console.log(map.getZoom());
    if (map.getZoom() >= minZoomForLoadingCities) {
      const bounds = getCurrentBounds(map);

      const publishedCitiesInViewport: CityOnMap[] = [];
      for (let id in cityMarkers) {
        let marker = cityMarkers[id];

        // Check if the marker is in the current map bounds
        if (bounds.contains(marker.getLatLng()) && citiesMap[id].isPublished) {
          publishedCitiesInViewport.push(citiesMap[id]);
        }
      }

      const newCities = publishedCitiesInViewport.filter(
        (c) => !(c.code in loadedCities)
      );
      console.log(newCities.map((c) => c.name));

      const result = await loadMunicipalitiesByCityCodes(
        newCities.map((c) => c.code)
      );

      if (result) {
        for (let id in result) {
          const { addressesLayerGroup, schoolsLayerGroup } = createCityLayers(
            result[id]
          );
          loadedCities[id] = {
            city: citiesMap[id],
            addressesLayerGroup,
            schoolsLayerGroup,
          };
        }
      }

      // show schools of cities in viewport
      publishedCitiesInViewport.forEach((city) => {
        if (!citiesWithShownSchools.has(city.code)) {
          const loadedCity = loadedCities[city.code];
          if (loadedCity) {
            map.addLayer(loadedCity.schoolsLayerGroup);
            citiesWithShownSchools.add(city.code);
          }
        }
      });

      // hide schools of cities not in viewport
      Array.from(citiesWithShownSchools).forEach((code) => {
        if (!publishedCitiesInViewport.find((c) => c.code === code)) {
          const loadedCity = loadedCities[code];
          if (loadedCity) {
            map.removeLayer(loadedCity.schoolsLayerGroup);
            citiesWithShownSchools.delete(code);
          }
        }
      });

      if (map.getZoom() >= minZoomForAddressPoints) {
        // show addresses of cities in viewport
        publishedCitiesInViewport.forEach((city) => {
          if (!citiesWithShownAddresses.has(city.code)) {
            const loadedCity = loadedCities[city.code];
            if (loadedCity) {
              map.addLayer(loadedCity.addressesLayerGroup);
              citiesWithShownAddresses.add(city.code);
            }
          }
        });

        // hide addresses of cities not in viewport
        Array.from(citiesWithShownAddresses).forEach((code) => {
          if (!publishedCitiesInViewport.find((c) => c.code === code)) {
            const loadedCity = loadedCities[code];
            if (loadedCity) {
              map.removeLayer(loadedCity.addressesLayerGroup);
              citiesWithShownAddresses.delete(code);
            }
          }
        });
      }
    } else {
      // hide all schools
      Array.from(citiesWithShownSchools).forEach((code) => {
        const loadedCity = loadedCities[code];
        if (loadedCity) {
          map.removeLayer(loadedCity.schoolsLayerGroup);
          citiesWithShownSchools.delete(code);
        }
      });
    }

    if (map.getZoom() < minZoomForAddressPoints) {
      // hide all addresses
      Array.from(citiesWithShownAddresses).forEach((code) => {
        const loadedCity = loadedCities[code];
        if (loadedCity) {
          map.removeLayer(loadedCity.addressesLayerGroup);
          citiesWithShownAddresses.delete(code);
        }
      });
    }
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
