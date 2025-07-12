import { SchoolType } from "@/types/basicTypes";
import { CityData, CityOnMap, CreateMapResult } from "@/types/mapTypes";
import { SuggestionItem } from "@/types/suggestionTypes";
import { onCitiesLoaded, triggerCityLoaded } from "@/utils/client/events";
import {
  centerLeafletMapOnMarker,
  createAddressForSuggestionItem,
  createCityLayers,
  findPointByGPS,
  getUnknownPopupContent,
  loadMunicipalitiesByCityCodes,
  prepareMap,
  resetAllHighlights,
  setupPopups,
} from "@/utils/client/mapUtils";
import {
  createCityMarker,
  createSvgIcon,
  createTempMarker,
} from "@/utils/client/markers";
import L, { Map as LeafletMap, Marker } from "leaflet";
import debounce from "lodash/debounce";

const citiesMap: Record<string, CityOnMap> = {};
let map: LeafletMap;
let mapInitialized = false;

const tempMarkerIcon = createSvgIcon("#e43f16");
const loadCitiesDebounceTime = 300;

export const createPublicMap = (
  element: HTMLElement,
  cities: CityOnMap[],
  showControls: boolean = true,
  schoolType: SchoolType
): CreateMapResult => {
  if (!element || mapInitialized) {
    return {
      destructor: () => {},
      onSuggestionSelect: () => {},
    };
  }

  map = prepareMap(element, showControls);
  mapInitialized = true;

  const bounds = L.latLngBounds([]);

  const cityMarkers: Record<string, Marker> = {};

  cities
    .filter((city) => city.isPublished)
    .forEach((city) =>
      createCityMarker(city, cityMarkers, citiesMap, bounds, schoolType).addTo(
        map
      )
    );

  setupPopups(map);

  map.fitBounds(bounds);

  const zoomEndHandler = createPublicMoveAndZoomEndHandler(
    map,
    cityMarkers,
    citiesMap,
    schoolType
  );
  map.on("zoom", zoomEndHandler);
  map.on("move", zoomEndHandler);
  zoomEndHandler();

  return {
    destructor: () => {
      map.remove();
      mapInitialized = false;
    },
    onSuggestionSelect,
  };
};

const minZoomForLoadingCities = 11;
const minZoomForAddressPoints = 14;
const loadedCities = new Map<number, CityData>();
const loadingCities = new Set<number>();
const citiesWithShownSchools = new Set<number>();
const citiesWithShownAddresses = new Set<number>();

const createPublicMoveAndZoomEndHandler = (
  map: LeafletMap,
  cityMarkers: Record<string, Marker>,
  citiesMap: Record<string, CityOnMap>,
  schoolType: SchoolType
) => {
  return debounce(async () => {
    if (map.getZoom() >= minZoomForLoadingCities) {
      const publishedCitiesInViewport = getPublishedCitiesInViewport(
        map,
        cityMarkers
      );

      await loadNewCities(publishedCitiesInViewport, citiesMap, schoolType);

      // show schools of cities in viewport
      publishedCitiesInViewport.forEach((city) => {
        showSchools(city.code);
      });

      // hide schools of cities not in viewport
      citiesWithShownSchools.forEach((code) => {
        if (!publishedCitiesInViewport.find((c) => c.code === code)) {
          hideSchools(code);
        }
      });

      if (map.getZoom() >= minZoomForAddressPoints) {
        // show addresses of cities in viewport
        publishedCitiesInViewport.forEach((city) => {
          showAddresses(city.code);
        });

        // hide addresses of cities not in viewport
        citiesWithShownAddresses.forEach((code) => {
          if (!publishedCitiesInViewport.find((c) => c.code === code)) {
            hideAddresses(code);
          }
        });
      }
    } else {
      // hide all schools
      citiesWithShownSchools.forEach((code) => {
        hideSchools(code);
      });
      resetAllHighlights({ exceptAddressHighlights: true });
    }

    if (map.getZoom() < minZoomForAddressPoints) {
      // hide all addresses
      citiesWithShownAddresses.forEach((code) => {
        hideAddresses(code);
      });
    }
  }, loadCitiesDebounceTime);
};

const hideAddresses = (code: number) => {
  if (loadedCities.has(code)) {
    map.removeLayer(loadedCities.get(code)!.addressesLayerGroup);
    citiesWithShownAddresses.delete(code);
  }
};

const showAddresses = (code: number) => {
  if (!citiesWithShownAddresses.has(code) && loadedCities.has(code)) {
    citiesWithShownAddresses.add(code);
    map.addLayer(loadedCities.get(code)!.addressesLayerGroup);
    loadedCities.get(code)!.schoolsLayerGroup.bringToFront();
  }
};

const showSchools = (code: number) => {
  if (!citiesWithShownSchools.has(code) && loadedCities.has(code)) {
    citiesWithShownSchools.add(code);
    map.addLayer(loadedCities.get(code)!.polygonLayerGroup);
    map.addLayer(loadedCities.get(code)!.schoolsLayerGroup);
  }
};

const hideSchools = (code: number) => {
  if (loadedCities.has(code)) {
    map.removeLayer(loadedCities.get(code)!.schoolsLayerGroup);
    map.removeLayer(loadedCities.get(code)!.polygonLayerGroup);
    citiesWithShownSchools.delete(code);
  }
};

// The rectangle size
const widthKm = 54;
const heightKm = 30;

// Approximate km per degree
const kmPerLatDegree = 111;
const kmPerLngDegree = 73;

const latChange = heightKm / kmPerLatDegree;
const lngChange = widthKm / kmPerLngDegree;

const getCurrentBounds = (map: LeafletMap) => {
  const center = map.getCenter();

  const topLeftLatLng = L.latLng(
    center.lat + latChange / 2,
    center.lng - lngChange / 2
  );
  const bottomRightLatLng = L.latLng(
    center.lat - latChange / 2,
    center.lng + lngChange / 2
  );

  return L.latLngBounds(topLeftLatLng, bottomRightLatLng).extend(
    map.getBounds()
  );
};

const getPublishedCitiesInViewport = (
  map: LeafletMap,
  cityMarkers: Record<string, Marker>
) => {
  const bounds = getCurrentBounds(map);
  const publishedCitiesInViewport: CityOnMap[] = [];
  for (let id in cityMarkers) {
    let marker = cityMarkers[id];

    // Check if the marker is in the current map bounds
    if (bounds.contains(marker.getLatLng()) && citiesMap[id].isPublished) {
      publishedCitiesInViewport.push(citiesMap[id]);
    }
  }
  return publishedCitiesInViewport;
};

const loadNewCities = async (
  publishedCitiesInViewport: CityOnMap[],
  citiesMap: Record<string, CityOnMap>,
  schoolType: SchoolType
) => {
  const newCities = publishedCitiesInViewport.filter(
    (c) => !loadingCities.has(c.code) && !loadedCities.has(c.code)
  );

  if (newCities.length === 0) {
    return;
  }

  newCities.forEach((c) => loadingCities.add(c.code));

  try {
    const result = await loadMunicipalitiesByCityCodes(
      newCities.map((c) => c.code),
      schoolType
    );

    if (result) {
      for (const id of Object.keys(result)) {
        const {
          addressesLayerGroup,
          schoolsLayerGroup,
          polygonLayerGroup,
          addressMarkers,
        } = createCityLayers({
          data: result[Number(id)],
          cityCode: id,
        });
        loadedCities.set(Number(id), {
          city: citiesMap[id],
          data: result[Number(id)],
          addressesLayerGroup,
          schoolsLayerGroup,
          polygonLayerGroup,
          addressMarkers,
        });

        triggerCityLoaded(Number(id));
      }
    }
  } finally {
    newCities.forEach((c) => loadingCities.delete(c.code));
  }
};

const flyingTime = 1000;

const onSuggestionSelect = (item: SuggestionItem) => {
  const position = new L.LatLng(item.position.lat, item.position.lon);
  // find three closest cities
  const closestCities = Object.values(citiesMap)
    .map((city) => ({
      city,
      // use library to calculate distance
      distance: city.isPublished
        ? position.distanceTo([city.lat, city.lng])
        : Infinity,
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map((item) => item.city);

  map.flyTo([item.position.lat, item.position.lon], 14, {
    duration: flyingTime / 1000,
  });
  const tempMarker = createTempMarker(item)
    .bindPopup(
      `${createAddressForSuggestionItem(
        item
      )}<br><br><em>Načítám podrobnosti...</em>`
    )
    .addTo(map);

  setTimeout(() => {
    tempMarker.openPopup();
  }, 500);

  setTimeout(() => {
    const toLoad = closestCities
      .filter((city) => loadingCities.has(city.code))
      .map((city) => city.code);

    // if there are cities to load, wait for them to load first
    if (toLoad.length > 0) {
      onCitiesLoaded(toLoad, () => {
        selectAddress(item, closestCities, tempMarker);
      });
    } else {
      // all cities are already loaded (or not in the viewport)
      selectAddress(item, closestCities, tempMarker);
    }
  }, flyingTime + loadCitiesDebounceTime + 200);
};

const selectAddress = (
  item: SuggestionItem,
  cities: CityOnMap[],
  tempMarker: L.Marker
) => {
  let found = false;
  for (const city of cities) {
    if (loadedCities.has(city.code)) {
      const loadedCity = loadedCities.get(city.code)!;
      const addressPoint = findPointByGPS(
        loadedCity.data.municipalities,
        item.position
      );

      if (addressPoint) {
        const markers = loadedCity.addressMarkers[addressPoint.address];
        if (markers && markers.length > 0) {
          setTimeout(() => {
            tempMarker.remove();
            markers[0].openPopup();
          }, 200);
          setTimeout(() => {
            centerLeafletMapOnMarker(map, markers[0]);
          }, 400);
          found = true;
          break;
        }
      }
    }
  }

  if (!found) {
    tempMarker.setPopupContent(getUnknownPopupContent(item));
  }
};
