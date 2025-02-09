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
    unmappedRegistrationNumberLayerGroup,
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
  layerGroupsForControl[texts.unmappedRegistrationNumberAddressPoints] =
    unmappedRegistrationNumberLayerGroup;

  setupPopups(map);

  map.fitBounds(polygonLayerGroup.getBounds());

  if (
    Object.keys(layerGroupsForControl).length > 1 &&
    options.showLayerControls
  ) {
    L.control.layers(undefined, layerGroupsForControl).addTo(map);
  }

  map.addLayer(polygonLayerGroup);
  if (schoolsLayerGroup.getLayers().length <= 20) {
    map.addLayer(addressesLayerGroup);
  }
  map.addLayer(schoolsLayerGroup);
  map.addLayer(unmappedLayerGroup);
  map.addLayer(unmappedRegistrationNumberLayerGroup);

  polygonLayerGroup.on("add", () => {
    polygonLayerGroup.bringToBack();
  });

  return () => {
    map.remove();
  };
};
