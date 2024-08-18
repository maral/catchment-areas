import { DataForMap, MapOptions } from "@/types/mapTypes";
import {
  createCityLayers,
  prepareMap,
  setupPopups,
} from "@/utils/client/mapUtils";
import { texts } from "@/utils/shared/texts";
import L, { LayerGroup, Map as LeafletMap } from "leaflet";

let map: LeafletMap;

export const createMap = (
  element: HTMLElement,
  data: DataForMap,
  options: MapOptions = {}
): (() => void) => {
  if (!element || map) {
    return () => null;
  }

  map = prepareMap(element, options.showControls ?? false);

  const {
    addressesLayerGroup,
    schoolsLayerGroup,
    unmappedLayerGroup,
    polygonLayerGroup,
  } = createCityLayers({
    data,
    options,
  });

  const layerGroupsForControl: Record<string, LayerGroup> = {};

  layerGroupsForControl[texts.schools] = schoolsLayerGroup;
  layerGroupsForControl[texts.polygons] = polygonLayerGroup;
  layerGroupsForControl[texts.addressPoints] = addressesLayerGroup;
  layerGroupsForControl[texts.unmappedAddressPoints] = unmappedLayerGroup;

  setupPopups(map);

  map.fitBounds(polygonLayerGroup.getBounds());

  if (
    Object.keys(layerGroupsForControl).length > 1 &&
    options.showLayerControls
  ) {
    L.control.layers(undefined, layerGroupsForControl).addTo(map);
  }

  map.addLayer(polygonLayerGroup);
  map.addLayer(addressesLayerGroup);
  map.addLayer(schoolsLayerGroup);
  map.addLayer(unmappedLayerGroup);

  polygonLayerGroup.on("add", () => {
    polygonLayerGroup.bringToBack();
  });

  return () => {
    map.remove();
  };
};
