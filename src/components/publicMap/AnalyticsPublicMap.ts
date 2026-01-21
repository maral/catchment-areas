import { SchoolType } from "@/types/basicTypes";
import {
  CitiesAnalyticsData,
  CityOnMap,
  CityPopupAnalyticsData,
  DataForMapByCityCodes,
  isAnalyticsMarker,
} from "@/types/mapTypes";
import { AnalyticsData } from "@/entities/AnalyticsData";
import {
  loadAnalyticsDataByCityCodes,
  loadSchoolsWithoutOrdinances,
  setupPopups,
} from "@/utils/client/mapUtils";
import {
  createAnalyticsCityMarker,
  createAnalyticsClusterIcon,
  getClusterRadius,
  updateAnalyticsMarkerForZoom,
} from "@/utils/client/markers";
import { texts } from "@/utils/shared/texts";
import L from "leaflet";

import { CorePublicMap } from "./CorePublicMap";

import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export class AnalyticsPublicMap extends CorePublicMap {
  private cityMarkersClusterGroup: L.MarkerClusterGroup;
  private analyticsGroups: Record<string, L.LayerGroup | L.MarkerClusterGroup>;

  private popupDataCache = new Map<string, CityPopupAnalyticsData>();

  private analyticsDataCache = new Map<number, AnalyticsData[]>();

  constructor(
    element: HTMLElement,
    cities: CityOnMap[],
    showControls: boolean,
    schoolType: SchoolType,
    private cityData: CitiesAnalyticsData,
  ) {
    super(element, cities, showControls, schoolType);

    this.cityMarkersClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: true,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      maxClusterRadius: getClusterRadius,
      iconCreateFunction: createAnalyticsClusterIcon,
    });

    this.analyticsGroups = {
      schools: L.layerGroup(),
      polygons: L.layerGroup(),
      addresses: L.layerGroup(),
      uaStudents: L.layerGroup(),
      npiConsultations: L.layerGroup(),
      cities: this.cityMarkersClusterGroup,
    };
  }

  protected createMarkers(): void {
    this.cities.forEach((city) => {
      if (this.cityData[city.code]?.socialExclusionIndex) {
        const marker = createAnalyticsCityMarker(
          city,
          this.cityMarkers,
          this.citiesMap,
          this.bounds,
          this.cityData,
        );
        this.cityMarkersClusterGroup.addLayer(marker);
      }
    });

    setupPopups(this.map, async (popup) => {
      await this.createAnalyticsPopupContent(popup);
    });
  }

  protected setupLayerStructure(): void {
    L.control
      .layers(undefined, {
        [texts.city]: this.analyticsGroups.cities,
        [texts.schools]: this.analyticsGroups.schools,
        [texts.catchmentAreas]: this.analyticsGroups.polygons,
        [texts.addressPoints]: this.analyticsGroups.addresses,
        [texts.uaStudents]: this.analyticsGroups.uaStudents,
        [texts.consultationsNpi]: this.analyticsGroups.npiConsultations,
      })
      .addTo(this.map);

    this.map.addLayer(this.analyticsGroups.cities);
    this.map.addLayer(this.analyticsGroups.polygons);
    this.map.addLayer(this.analyticsGroups.schools);
    this.map.addLayer(this.analyticsGroups.uaStudents);
    this.map.addLayer(this.analyticsGroups.npiConsultations);
  }

  protected async getAdditionalData(
    codes: number[],
    loadedCodes: number[],
  ): Promise<{
    analyticsData: AnalyticsData[];
    municipalitiesWithoutOrdinances: DataForMapByCityCodes;
  }> {
    const missingCodes = codes.filter((code) => !loadedCodes.includes(code));
    const codesToFetch = codes.filter(
      (code) => !this.analyticsDataCache.has(code),
    );

    const municipalitiesPromise =
      missingCodes.length > 0
        ? loadSchoolsWithoutOrdinances(missingCodes, this.schoolType)
        : Promise.resolve([]);

    const analyticsPromise =
      codesToFetch.length > 0
        ? loadAnalyticsDataByCityCodes(codesToFetch, this.schoolType)
        : Promise.resolve([]);

    const [municipalitiesWithoutOrdinances, newAnalyticsData] =
      await Promise.all([municipalitiesPromise, analyticsPromise]);

    if (codesToFetch.length > 0) {
      const analyticsByCity = new Map<string, AnalyticsData[]>();
      newAnalyticsData.forEach((analytics: AnalyticsData) => {
        const cityKey = String(analytics.city);
        if (!analyticsByCity.has(cityKey)) {
          analyticsByCity.set(cityKey, []);
        }
        analyticsByCity.get(cityKey)!.push(analytics);
      });
      codesToFetch.forEach((code) => {
        const cityAnalytics = analyticsByCity.get(String(code)) || [];
        this.analyticsDataCache.set(code, cityAnalytics);
      });
    }

    const analyticsData = codes.flatMap(
      (code) => this.analyticsDataCache.get(code) || [],
    );

    return {
      analyticsData,
      municipalitiesWithoutOrdinances: municipalitiesWithoutOrdinances || [],
    };
  }

  protected showSchools(code: number): void {
    if (this.citiesWithShownSchools.has(code) || !this.loadedCities.has(code)) {
      return;
    }

    this.citiesWithShownSchools.add(code);

    const cityData = this.loadedCities.get(code)!;
    this.analyticsGroups.schools.addLayer(cityData.schoolsLayerGroup);
    this.analyticsGroups.polygons.addLayer(cityData.polygonLayerGroup);

    if (cityData.analyticsUaLayerGroup) {
      this.analyticsGroups.uaStudents.addLayer(cityData.analyticsUaLayerGroup);
    }
    if (cityData.analyticsNpiLayerGroup) {
      this.analyticsGroups.npiConsultations.addLayer(
        cityData.analyticsNpiLayerGroup,
      );
    }
  }

  protected hideSchools(code: number): void {
    if (!this.loadedCities.has(code)) return;

    const cityData = this.loadedCities.get(code)!;

    this.analyticsGroups.schools.removeLayer(cityData.schoolsLayerGroup);
    this.analyticsGroups.polygons.removeLayer(cityData.polygonLayerGroup);

    if (cityData.analyticsUaLayerGroup) {
      this.analyticsGroups.uaStudents.removeLayer(
        cityData.analyticsUaLayerGroup,
      );
    }
    if (cityData.analyticsNpiLayerGroup) {
      this.analyticsGroups.npiConsultations.removeLayer(
        cityData.analyticsNpiLayerGroup,
      );
    }

    this.citiesWithShownSchools.delete(code);
  }

  protected showAddresses(code: number): void {
    if (
      this.citiesWithShownAddresses.has(code) ||
      !this.loadedCities.has(code)
    ) {
      return;
    }

    this.citiesWithShownAddresses.add(code);

    const cityData = this.loadedCities.get(code)!;

    this.analyticsGroups.addresses.addLayer(cityData.addressesLayerGroup);
  }

  protected hideAddresses(code: number): void {
    if (!this.loadedCities.has(code)) return;

    const cityData = this.loadedCities.get(code)!;

    this.analyticsGroups.addresses.removeLayer(cityData.addressesLayerGroup);

    this.citiesWithShownAddresses.delete(code);
  }

  protected onZoomParamsChanged(zoom: number): void {
    this.updateAllAnalyticsMarkers(zoom);
  }

  private updateAllAnalyticsMarkers(currentZoom: number): void {
    this.citiesWithShownSchools.forEach((code) => {
      const cityData = this.loadedCities.get(code);
      if (!cityData) return;

      [cityData.analyticsUaLayerGroup, cityData.analyticsNpiLayerGroup].forEach(
        (layerGroup) => {
          layerGroup?.eachLayer((layer) => {
            if (isAnalyticsMarker(layer)) {
              updateAnalyticsMarkerForZoom(
                {
                  marker: layer,
                  line: layer.analyticsLine,
                  ...layer.analyticsInfo,
                },
                currentZoom,
              );
            }
          });
        },
      );
    });
  }

  private async createAnalyticsPopupContent(popup: L.Popup): Promise<void> {
    const popupContent = popup.getElement();
    const cityDataEl = popupContent?.querySelector(".city-data");
    if (!cityDataEl) {
      return;
    }

    const cityCode = cityDataEl.getAttribute("data-city");

    if (!cityCode) {
      return;
    }

    const title = `<h5 class="font-semibold mb-1">${texts.statsOfSchools(
      this.schoolType,
    )}</h5>`;

    const cacheKey = `${cityCode}-${this.schoolType}`;

    const cachedData = this.popupDataCache.get(cacheKey);

    if (cachedData) {
      cityDataEl.innerHTML = this.buildCityPopupHtml(cachedData, title);
      return;
    }

    cityDataEl.innerHTML = `
      <div class="mt-2 pt-2 border-t">
        ${title}
        <em>${texts.loading}</em>
      </div>
    `;

    const formData = new FormData();

    formData.set("cityCode", cityCode);
    formData.set("schoolType", this.schoolType.toString());

    const fetchInfo = await fetch("/api/map/analytics-data/sum", {
      method: "POST",
      body: formData,
    });

    if (fetchInfo.ok) {
      const body = await fetchInfo.json();

      this.popupDataCache.set(cacheKey, body.data);

      cityDataEl.innerHTML = this.buildCityPopupHtml(body.data, title);
    } else {
      cityDataEl.innerHTML = `<em>${texts.noData}</em>`;
    }
  }

  private buildCityPopupHtml(
    data: CityPopupAnalyticsData,
    title: string,
  ): string {
    return `
      <div class="mt-2 pt-2 border-t">
        ${title}
        <ul class="text-xs">
          ${
            data?.totalStudents
              ? `<li>${texts.totalStudents}: ${data.totalStudents}</li>`
              : ""
          }
          ${
            data?.totalStudentsUa
              ? `<li>${texts.uaStudents}: ${data.totalStudentsUa} (${data.percentageStudentsUa}%)</li>`
              : ""
          }
          ${
            data?.consultationsNpi
              ? `<li>${texts.analyticsConsultationsNpi}: ${data.consultationsNpi}</li>`
              : ""
          }
        </ul>
      </div>
    `;
  }
}
