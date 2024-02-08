import {
  createCityLayers,
  createZoomEndHandler,
  prepareMap,
  setupPopups,
} from "@/utils/client/mapUtils";
import { texts } from "@/utils/shared/texts";
import L, { Map as LeafletMap } from "leaflet";
import { Municipality } from "text-to-map";

let map: LeafletMap;

export const createMap = (
  element: HTMLElement,
  municipalities: Municipality[],
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
    municipalityLayerGroups,
    layerGroupsForControl,
    schoolsLayerGroup,
    bounds,
  } = createCityLayers({ municipalities, showDebugInfo: true, lines: text.split("\n") });

  schoolsLayerGroup.addTo(map);
  layerGroupsForControl[texts.schools] = schoolsLayerGroup;

  setupPopups(map);

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
