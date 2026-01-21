import { setupPopups } from "@/utils/client/mapUtils";
import { createCityMarker } from "@/utils/client/markers";
import { CorePublicMap } from "./CorePublicMap";

export class StandardPublicMap extends CorePublicMap {
  protected createMarkers(): void {
    this.cities
      .filter((city) => city.isPublished)
      .forEach((city) => {
        createCityMarker(
          city,
          this.cityMarkers,
          this.citiesMap,
          this.bounds,
          this.schoolType,
        ).addTo(this.map);
      });

    setupPopups(this.map);
  }

  protected setupLayerStructure(): void {}

  protected showSchools(code: number): void {
    if (this.citiesWithShownSchools.has(code) || !this.loadedCities.has(code)) {
      return;
    }

    const cityData = this.loadedCities.get(code)!;
    this.map.addLayer(cityData.polygonLayerGroup);
    this.map.addLayer(cityData.schoolsLayerGroup);
    this.citiesWithShownSchools.add(code);
  }

  protected hideSchools(code: number): void {
    if (!this.loadedCities.has(code)) return;

    const cityData = this.loadedCities.get(code)!;

    this.map.removeLayer(cityData.schoolsLayerGroup);
    this.map.removeLayer(cityData.polygonLayerGroup);

    this.citiesWithShownSchools.delete(code);
  }

  protected showAddresses(code: number): void {
    if (
      this.citiesWithShownAddresses.has(code) ||
      !this.loadedCities.has(code)
    ) {
      return;
    }

    const cityData = this.loadedCities.get(code)!;

    this.map.addLayer(cityData.addressesLayerGroup);
    cityData.schoolsLayerGroup.bringToFront();

    this.citiesWithShownAddresses.add(code);
  }

  protected hideAddresses(code: number): void {
    if (!this.loadedCities.has(code)) return;

    const cityData = this.loadedCities.get(code)!;

    this.map.removeLayer(cityData.addressesLayerGroup);

    this.citiesWithShownAddresses.delete(code);
  }
}
