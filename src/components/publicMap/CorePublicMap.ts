import { SchoolType } from "@/types/basicTypes";
import {
  CityData,
  CityOnMap,
  CreateMapResult,
  DataForMapByCityCodes,
} from "@/types/mapTypes";
import { AnalyticsData } from "@/entities/AnalyticsData";
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
} from "@/utils/client/mapUtils";
import { createTempMarker } from "@/utils/client/markers";
import L, { Map as LeafletMap, Marker } from "leaflet";
import debounce from "lodash/debounce";
import { texts } from "@/utils/shared/texts";

export const ZOOM_CONSTANTS = {
  minZoomForLoadingCities: 11,
  minZoomForAddressPoints: 14,
  loadCitiesDebounceTime: 300,
  flyingTime: 1000,
} as const;

const VIEWPORT_CONSTANTS = {
  widthKm: 54,
  heightKm: 30,
  kmPerLatDegree: 111,
  kmPerLngDegree: 73,
} as const;

const latChange =
  VIEWPORT_CONSTANTS.heightKm / VIEWPORT_CONSTANTS.kmPerLatDegree;
const lngChange =
  VIEWPORT_CONSTANTS.widthKm / VIEWPORT_CONSTANTS.kmPerLngDegree;

export abstract class CorePublicMap {
  protected map: LeafletMap;
  protected citiesMap: Record<string, CityOnMap> = {};
  protected bounds = L.latLngBounds([]);

  protected loadedCities = new Map<number, CityData>();
  protected loadingCities = new Set<number>();
  protected missingCities = new Set<number>();
  protected citiesWithShownSchools = new Set<number>();
  protected citiesWithShownAddresses = new Set<number>();
  protected cityMarkers: Record<string, Marker> = {};

  protected debounceHandler: (() => void) | null = null;

  constructor(
    protected element: HTMLElement,
    protected cities: CityOnMap[],
    protected showControls: boolean,
    protected schoolType: SchoolType,
  ) {
    this.map = prepareMap(element, showControls);
    this.cities.forEach((c) => (this.citiesMap[c.code] = c));
  }

  public init(): CreateMapResult {
    this.createMarkers();
    this.setupLayerStructure();

    this.map.fitBounds(this.bounds);

    this.debounceHandler = debounce(
      () => this.handleZoomOrMove(),
      ZOOM_CONSTANTS.loadCitiesDebounceTime,
    );
    this.map.on("zoom", this.debounceHandler);
    this.map.on("move", this.debounceHandler);

    this.debounceHandler();

    return {
      destructor: () => this.destroy(),
      onSuggestionSelect: (item) => this.onSuggestionSelect(item),
    };
  }

  protected async handleZoomOrMove() {
    const currentZoom = this.map.getZoom();

    if (currentZoom >= ZOOM_CONSTANTS.minZoomForLoadingCities) {
      const publishedCitiesInViewport = this.getPublishedCitiesInViewport();

      const viewportCityCodes = new Set(
        publishedCitiesInViewport.map((c) => c.code),
      );

      await this.loadNewCities(publishedCitiesInViewport);

      // show schools of cities in viewport
      publishedCitiesInViewport.forEach((city) => {
        this.showSchools(city.code);
      });

      // hide schools of cities not in viewport
      this.citiesWithShownSchools.forEach((code) => {
        if (!viewportCityCodes.has(code)) {
          this.hideSchools(code);
        }
      });

      if (currentZoom >= ZOOM_CONSTANTS.minZoomForAddressPoints) {
        // show addresses of cities in viewport
        publishedCitiesInViewport.forEach((city) => {
          this.showAddresses(city.code);
        });

        // hide addresses of cities not in viewport
        this.citiesWithShownAddresses.forEach((code) => {
          if (!viewportCityCodes.has(code)) {
            this.hideAddresses(code);
          }
        });
      }
    } else {
      // hide all schools
      this.citiesWithShownSchools.forEach((code) => {
        this.hideSchools(code);
      });

      resetAllHighlights({ exceptAddressHighlights: true });
    }

    if (currentZoom < ZOOM_CONSTANTS.minZoomForAddressPoints) {
      // hide all addresses
      this.citiesWithShownAddresses.forEach((code) => {
        this.hideAddresses(code);
      });
    }

    // Hook for analytics map layer
    this.onZoomParamsChanged(currentZoom);
  }

  protected async loadNewCities(publishedCitiesInViewport: CityOnMap[]) {
    const newCities = publishedCitiesInViewport.filter(
      (c) =>
        !this.loadingCities.has(c.code) &&
        !this.loadedCities.has(c.code) &&
        !this.missingCities.has(c.code),
    );
    if (newCities.length === 0) return;

    newCities.forEach((c) => this.loadingCities.add(c.code));

    const codes = newCities.map((c) => c.code);

    try {
      let result = await loadMunicipalitiesByCityCodes(codes, this.schoolType);
      const loadedCodes = result ? Object.keys(result).map(Number) : [];

      // To prevent refetching cities without ordinance in AnalyticsPublicMap
      const notReturnedCodes = codes.filter(
        (code) => !loadedCodes.includes(code),
      );
      notReturnedCodes.forEach((code) => {
        if (!this.missingCities.has(code)) {
          this.missingCities.add(code);
        }
      });
      const { analyticsData, municipalitiesWithoutOrdinances } =
        await this.getAdditionalData(codes, loadedCodes);
      if (municipalitiesWithoutOrdinances) {
        result = { ...result, ...municipalitiesWithoutOrdinances };
      }

      if (result) {
        for (const id of Object.keys(result)) {
          const layers = createCityLayers({
            data: result[Number(id)],
            cityCode: id,
            analyticsData: analyticsData,
            currentZoom: this.map.getZoom(),
          });

          this.loadedCities.set(Number(id), {
            city: this.citiesMap[id],
            data: result[Number(id)],
            ...layers,
          });

          triggerCityLoaded(Number(id));
        }
      }
    } finally {
      newCities.forEach((c) => this.loadingCities.delete(c.code));
    }
  }

  protected getCurrentBounds() {
    const center = this.map.getCenter();

    const topLeftLatLng = L.latLng(
      center.lat + latChange / 2,
      center.lng - lngChange / 2,
    );
    const bottomRightLatLng = L.latLng(
      center.lat - latChange / 2,
      center.lng + lngChange / 2,
    );
    return L.latLngBounds(topLeftLatLng, bottomRightLatLng).extend(
      this.map.getBounds(),
    );
  }

  protected getPublishedCitiesInViewport(): CityOnMap[] {
    const bounds = this.getCurrentBounds();

    return Object.entries(this.cityMarkers)
      .filter(
        ([id, marker]) =>
          bounds.contains(marker.getLatLng()) &&
          this.citiesMap[id]?.isPublished,
      )
      .map(([id]) => this.citiesMap[id]);
  }

  protected destroy() {
    if (this.debounceHandler) {
      this.map.off("zoom", this.debounceHandler);
      this.map.off("move", this.debounceHandler);
    }
    this.map.remove();
  }

  public onSuggestionSelect(item: SuggestionItem): void {
    const position = new L.LatLng(item.position.lat, item.position.lon);

    // Find three closest cities
    const closestCities = Object.values(this.citiesMap)
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

    this.map.flyTo([item.position.lat, item.position.lon], 14, {
      duration: ZOOM_CONSTANTS.flyingTime / 1000,
    });

    //If search item is municipality not address only fly to location without marker
    if (item.type === "regional.municipality") {
      return;
    }

    const tempMarker = createTempMarker(item)
      .bindPopup(
        `${createAddressForSuggestionItem(
          item,
        )}<br><br><em>${texts.loading}</em>`,
      )
      .addTo(this.map);

    setTimeout(() => {
      tempMarker.openPopup();
    }, 500);

    setTimeout(
      () => {
        const toLoad = closestCities
          .filter((city) => this.loadingCities.has(city.code))
          .map((city) => city.code);

        // If there are cities to load, wait for them to load first
        if (toLoad.length > 0) {
          onCitiesLoaded(toLoad, () => {
            this.selectAddress(item, closestCities, tempMarker);
          });
        } else {
          // All cities are already loaded (or not in the viewport)
          this.selectAddress(item, closestCities, tempMarker);
        }
      },
      ZOOM_CONSTANTS.flyingTime + ZOOM_CONSTANTS.loadCitiesDebounceTime + 200,
    );
  }

  protected selectAddress(
    item: SuggestionItem,
    cities: CityOnMap[],
    tempMarker: L.Marker,
  ): void {
    let found = false;
    for (const city of cities) {
      if (this.loadedCities.has(city.code)) {
        const loadedCity = this.loadedCities.get(city.code)!;
        const addressPoint = findPointByGPS(
          loadedCity.data.municipalities,
          item.position,
        );

        if (addressPoint) {
          const markers = loadedCity.addressMarkers[addressPoint.address];
          if (markers && markers.length > 0) {
            setTimeout(() => {
              tempMarker.remove();
              markers[0].openPopup();
            }, 200);
            setTimeout(() => {
              centerLeafletMapOnMarker(this.map, markers[0]);
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
  }

  // --- Abstract Methods (different for standard/analytics map) ---

  protected abstract createMarkers(): void;

  protected abstract setupLayerStructure(): void;

  protected async getAdditionalData(
    codes: number[],
    loadedCodes: number[],
  ): Promise<{
    analyticsData: AnalyticsData[];
    municipalitiesWithoutOrdinances: DataForMapByCityCodes;
  }> {
    return { analyticsData: [], municipalitiesWithoutOrdinances: [] };
  }

  protected abstract showSchools(code: number): void;
  protected abstract hideSchools(code: number): void;

  protected abstract showAddresses(code: number): void;
  protected abstract hideAddresses(code: number): void;

  protected onZoomParamsChanged(zoom: number): void {}
}
