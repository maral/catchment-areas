import {
  AddressLayerGroup,
  MarkerMap,
  SchoolLayerGroup,
} from "@/types/mapTypes";
import {
  colors,
  createCityLayers,
  createSchoolMarkers,
  createZoomEndHandler,
  prepareMap,
  setupPopups,
} from "@/utils/client/mapUtils";
import { texts } from "@/utils/shared/texts";
import L, { Map as LeafletMap } from "leaflet";
import { Municipality } from "text-to-map";

let markers: MarkerMap = {};
let map: LeafletMap;

export const createMap = (
  element: HTMLElement,
  municipalities: Municipality[],
  center?: [number, number],
  zoom?: number,
  showControls: boolean = true,
  color?: string
): (() => void) => {
  if (!element || map) {
    return () => null;
  }

  map = prepareMap(element, showControls);

  const {
    municipalityLayerGroups,
    layerGroupsForControl,
    schoolsLayerGroup,
    bounds,
  } = createCityLayers(municipalities);

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
