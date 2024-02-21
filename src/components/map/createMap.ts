import { DataForMap } from "@/types/mapTypes";
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
  text: string,
  center?: [number, number],
  zoom?: number,
  showControls: boolean = true
): (() => void) => {
  if (!element || map) {
    return () => null;
  }

  map = prepareMap(element, showControls);

  L.circle([52, 12], {
    radius: 8,
    weight: 8,
    fill: true,
    fillColor: "red",
    fillOpacity: 1,
    color: "red",
  });

  const {
    addressesLayerGroup,
    schoolsLayerGroup,
    unmappedLayerGroup,
    polygonLayer,
  } = createCityLayers({
    data,
    showDebugInfo: true,
    lines: text.split("\n"),
  });

  const layerGroupsForControl: Record<string, LayerGroup> = {};

  layerGroupsForControl[texts.schools] = schoolsLayerGroup;
  layerGroupsForControl[texts.polygons] = polygonLayer;
  layerGroupsForControl[texts.addressPoints] = addressesLayerGroup;
  layerGroupsForControl[texts.unmappedAddressPoints] = unmappedLayerGroup;

  setupPopups(map);

  if (center) {
    map.setView(center, zoom ?? 15);
  } else {
    map.fitBounds(polygonLayer.getBounds());
    if (zoom) {
      map.setZoom(zoom);
    }
  }

  if (Object.keys(layerGroupsForControl).length > 1 && showControls) {
    L.control.layers(undefined, layerGroupsForControl).addTo(map);
  }

  // Object.values(layerGroupsForControl).forEach((layerGroup) => {
  //   map.addLayer(layerGroup);
  // });

  map.addLayer(polygonLayer);
  map.addLayer(addressesLayerGroup);
  map.addLayer(schoolsLayerGroup);
  map.addLayer(unmappedLayerGroup);

  polygonLayer.on("add", () => {
    polygonLayer.bringToBack();
  });

  return () => {
    map.remove();
  };
};
