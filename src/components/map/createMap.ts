import {
  AddressMarkerMap,
  CreateMapResult,
  DataForMap,
  MapOptions,
} from "@/types/mapTypes";
import { SuggestionItem } from "@/types/suggestionTypes";
import {
  centerLeafletMapOnMarker,
  createCityLayers,
  findPointByGPS,
  getUnknownPopupContent,
  prepareMap,
  setupPopups,
} from "@/utils/client/mapUtils";
import { createTempMarker } from "@/utils/client/markers";
import { texts } from "@/utils/shared/texts";
import L, { LayerGroup, Map as LeafletMap } from "leaflet";

let map: LeafletMap;
let dataForMap: DataForMap;
let markers: AddressMarkerMap;
let mapInitialized = false;
let unknownAddressMessage: string | undefined;

export const createMap = (
  element: HTMLElement,
  data: DataForMap,
  options: MapOptions = {}
): CreateMapResult => {
  if (!element || mapInitialized) {
    return {
      destructor: () => {},
      onSuggestionSelect: () => {},
    };
  }

  map = prepareMap(element, options.showControls ?? false);
  mapInitialized = true;

  const {
    addressesLayerGroup,
    schoolsLayerGroup,
    unmappedLayerGroup,
    unmappedRegistrationNumberLayerGroup,
    polygonLayerGroup,
    addressMarkers,
  } = createCityLayers({
    data,
    options,
  });
  dataForMap = data;
  unknownAddressMessage = options.unknownAddressMessage;
  markers = addressMarkers;

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

  return {
    destructor: () => {
      map.remove();
      mapInitialized = false;
    },
    onSuggestionSelect: onSuggest,
  };
};

export const onSuggest = (item: SuggestionItem) => {
  const addressPoint = findPointByGPS(
    dataForMap?.municipalities ?? [],
    item.position
  );
  const marker = addressPoint ? markers[addressPoint.address] : null;

  if (marker) {
    centerLeafletMapOnMarker(map, marker[0]);
  } else {
    const tempMarker = createTempMarker(item)
      .bindPopup(getUnknownPopupContent(item, unknownAddressMessage))
      .addTo(map)
      .openPopup();
    map.flyTo(tempMarker.getLatLng());
  }
};
