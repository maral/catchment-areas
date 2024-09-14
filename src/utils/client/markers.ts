import { School, ExportAddressPoint, Area } from "text-to-map";
import {
  SchoolMarker,
  PopupWithMarker,
  MarkerWithSchools,
  DataForMap,
  AddressLayerGroup,
  AddressesLayerGroup,
  SchoolLayerGroup,
  SchoolMarkerMap,
  AddressMarkerMap,
  CityOnMap,
  MapOptions,
} from "@/types/mapTypes";
import { colors, markerRadius, markerWeight } from "./mapUtils";
import L, { Marker } from "leaflet";

const unmappedMarkerColor = "#ff0000";

type MarkersToCreate = Record<
  string,
  { point: ExportAddressPoint; areas: Area[] }
>;

export const createMarkers = ({
  data,
  municipalityLayerGroups,
  addressesLayerGroup,
  schoolsLayerGroup,
  unmappedLayerGroup,
  unmappedRegistrationNumberLayerGroup,
  schoolMarkers,
  addressMarkers,
  areaColorIndicesMap,
  options,
}: {
  data: DataForMap;
  municipalityLayerGroups: AddressLayerGroup[];
  addressesLayerGroup: AddressesLayerGroup;
  schoolsLayerGroup: SchoolLayerGroup;
  unmappedLayerGroup: AddressLayerGroup;
  unmappedRegistrationNumberLayerGroup: AddressLayerGroup;
  schoolMarkers: SchoolMarkerMap;
  addressMarkers: AddressMarkerMap;
  areaColorIndicesMap: Record<string, number>;
  options: MapOptions;
}) => {
  const markersToCreate: MarkersToCreate = {};
  const schoolColors: Record<string, string> = {};
  const addressLayerGroupsMap: Record<string, AddressLayerGroup> = {};

  data.municipalities.forEach((municipality) => {
    const layerGroup: AddressLayerGroup = L.layerGroup();
    municipalityLayerGroups.push(layerGroup);
    addressesLayerGroup.addLayer(layerGroup);
    municipality.areas.forEach((area) => {
      area.schools.forEach((school) => {
        const schoolColor =
          options.color ?? colors[areaColorIndicesMap[area.index]];
        const schoolMarker = createSchoolMarker(school, schoolColor).addTo(
          schoolsLayerGroup
        );

        schoolColors[school.izo] = schoolColor;
        addressLayerGroupsMap[school.izo] = layerGroup;
        schoolMarkers[school.izo] = schoolMarker;
      });
      area.addresses.forEach((point) => {
        addToMarkersToCreate(point, markersToCreate, area);
      });
    });

    if (options.showDebugInfo) {
      municipality.unmappedPoints.forEach((point) => {
        addToMarkersToCreate(point, markersToCreate);
      });
    }
  });

  const lines = data.text.split("\n");
  Object.values(markersToCreate).forEach(({ point, areas }) => {
    const areaColors =
      areas.length === 0
        ? [unmappedMarkerColor]
        : areas.map(
            (area) => options.color ?? colors[areaColorIndicesMap[area.index]]
          );
    const schools = areas.flatMap((area) => area.schools);
    const newMarkers = createAddressMarker(
      point,
      areaColors,
      schools.map((s) => schoolMarkers[s.izo]) as SchoolMarker[],
      Boolean(options.showDebugInfo) && schools.length > 0,
      lines
    );
    addressMarkers[point.address] = newMarkers;
    newMarkers.forEach((marker) => {
      if (schools.length === 0) {
        if (point.address.includes("č.ev.")) {
          unmappedRegistrationNumberLayerGroup.addLayer(marker);
        } else {
          unmappedLayerGroup.addLayer(marker);
        }
      } else {
        addressLayerGroupsMap[schools[0].izo].addLayer(marker);
      }
    });
  });
};

const addToMarkersToCreate = (
  point: ExportAddressPoint,
  markersToCreate: MarkersToCreate,
  area?: Area
): void => {
  if (!point.lat || !point.lng) {
    return;
  }

  if (point.address in markersToCreate) {
    if (area) {
      markersToCreate[point.address].areas.push(area);
    }
    markersToCreate[point.address].point.lineNumbers?.push(
      ...(point.lineNumbers ?? [])
    );
  } else {
    markersToCreate[point.address] = {
      point,
      areas: area ? [area] : [],
    };
  }
};

const defaultPosition = [49.19506, 16.606837];

export const createSchoolMarker = (school: School, color: string) => {
  const schoolTooltip = L.tooltip({
    direction: "top",
    content: `<div style="text-align: center;">${school.name}</div>`,
    opacity: 1,
  });
  return L.circle(
    [
      school.position?.lat ?? defaultPosition[0],
      school.position?.lng ?? defaultPosition[1],
    ],
    {
      radius: 19,
      fill: true,
      fillColor: color,
      fillOpacity: 1,
      weight: 4,
      color,
      bubblingMouseEvents: false,
    }
  ).bindTooltip(schoolTooltip);
};

export const createAddressMarker = (
  point: ExportAddressPoint,
  colors: string[],
  schoolMarkers: SchoolMarker[],
  showDebugInfo: boolean,
  lines?: string[]
) => {
  const markers = createMarkerByColorCount(point, colors);
  markers.forEach((marker) => {
    const popup: PopupWithMarker = Object.assign(
      L.popup().setContent(`
    <div>
      ${point.address}

      ${
        showDebugInfo
          ? `<br><br><em>${
              Array.from(new Set(point.lineNumbers))
                ?.map((line) => `řádek ${line + 1}: ${lines?.[line]}`)
                .join("<br>") ?? ""
            }</em>`
          : ""
      }

      ${
        schoolMarkers.length > 0
          ? createAddressMarkerButton()
          : "<br><br><em>Adresní místo bez spádové školy</em>"
      }
    </div>`),
      { marker: marker }
    );
    marker.bindPopup(popup);
    marker.schools = schoolMarkers;
  });
  return markers;
};

const createMarkerByColorCount = (
  point: ExportAddressPoint,
  colors: string[]
): MarkerWithSchools[] => {
  if (colors.length > 1) {
    const angle = 360 / colors.length;
    return colors.map((color, index) =>
      L.circle(
        flip(
          rotatePointOnCircle(
            point.lng,
            point.lat,
            0.00005,
            angle * index,
            1,
            0.7
          )
        ),
        {
          radius: markerRadius,
          fill: true,
          fillColor: color,
          fillOpacity: 1,
          weight: markerWeight,
          color: color,
        }
      )
    );
  } else {
    return [
      L.circle([point.lat, point.lng], {
        radius: markerRadius,
        fill: true,
        fillColor: colors[0],
        fillOpacity: 1,
        weight: markerWeight,
        color: colors[0],
      }),
    ];
  }
};

export const createSvgIcon = (color: string): L.DivIcon => {
  return L.divIcon({
    html: `
  <svg
    width="24"
    height="24"
    viewBox="0 0 100 100"
    version="1.1"
    preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M0 0 L50 100 L100 0 Z" fill="${color}"></path>
  </svg>`,
    className: "svg-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
};

const publicIcon = createSvgIcon("#03b703");
const notReadyIcon = createSvgIcon("#999");

export const createCityMarker = (
  city: CityOnMap,
  cityMarkers: Record<string, Marker>,
  citiesMap: Record<string, CityOnMap>,
  bounds: L.LatLngBounds
) => {
  const marker = L.marker([city.lat, city.lng], {
    icon: city.isPublished ? publicIcon : notReadyIcon,
  }).bindPopup(
    `<div class="text-center"><span class="text-base font-semibold">${
      city.name
    }</span><br> ${
      city.isPublished
        ? `${createCityMarkerButton(city.code)}`
        : "zatím není připraveno"
    }</div>`
  );
  marker.setZIndexOffset(city.isPublished ? 1000 : 900);
  cityMarkers[city.code] = marker;
  citiesMap[city.code] = city;
  bounds.extend(marker.getLatLng());
  return marker;
};

const rotatePointOnCircle = (
  x: number,
  y: number,
  r: number,
  degrees: number,
  xCoefficient = 1,
  yCoefficient = 1
): [number, number] => {
  const radians = (degrees * Math.PI) / 180;
  const newX = x + r * Math.sin(radians) * xCoefficient;
  const newY = y - r * Math.cos(radians) * yCoefficient;
  return [newX, newY];
};

const flip = ([x, y]: [number, number]): [number, number] => {
  return [y, x];
};

const createAddressMarkerButton = () => `
<div class="text-center mt-2"><button class="${getButtonClasses()} marker-button">
  Zobrazit spádovou školu
</button></div>`;

const createCityMarkerButton = (cityCode: number) => `
<div class="text-center mt-3"><a href="/api/ordinances/download/by-city-code/${cityCode}" target="_blank" class="city-marker ${getButtonClasses()} mt-2">
  ${getDownloadHeroicon()} Stáhnout vyhlášku
</a></div>`;

const getButtonClasses = () => {
  return `border rounded px-2 py-1 text-xs bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-700`;
};

const getDownloadHeroicon =
  () => `<svg class="inline-block w-4 h-4 relative" style="top: -1px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
</svg>`;
