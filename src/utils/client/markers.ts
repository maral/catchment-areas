import { ButtonVariant, buttonVariants } from "@/components/ui/button";
import { getRootPathBySchoolType } from "@/entities/School";
import { AnalyticsDataType, SchoolType } from "@/types/basicTypes";
import {
  AddressLayerGroup,
  AddressMarkerMap,
  AddressesLayerGroup,
  AnalyticsMarker,
  AnalyticsMarkerInfo,
  CityOnMap,
  DataForMap,
  MapOptions,
  MarkerWithSchools,
  PopupWithMarker,
  SchoolLayerGroup,
  SchoolMarker,
  SchoolMarkerMap,
} from "@/types/mapTypes";
import { LayerGroup } from "leaflet";
import { SuggestionItem } from "@/types/suggestionTypes";
import L, { Marker } from "leaflet";
import { Area, ExportAddressPoint, School } from "text-to-map";
import { colors, markerRadius, markerWeight } from "./mapUtils";
import { AnalyticsData } from "@/entities/AnalyticsData";
import { texts } from "../shared/texts";

const unmappedMarkerColor = "#ff0000";
const defaultPosition = [49.19506, 16.606837];

type MarkersToCreate = Record<
  string,
  { point: ExportAddressPoint; areas: Area[] }
>;

const getAnalyticsMarkerPosition = (
  schoolLat: number,
  schoolLng: number,
  markerIndex: number,
  totalMarkers: number,
  zoom: number = 11
): [number, number] => {
  const baseRadius = 0.0008;
  const radius = Math.max(
    0.00015,
    Math.min(0.003, baseRadius * Math.pow(1.5, 15 - zoom))
  );
  const angle = (360 / totalMarkers) * markerIndex;

  const [lng, lat] = rotatePointOnCircle(schoolLng, schoolLat, radius, angle);

  return [lat, lng];
};

//linear interpolation for size of icon based on zoom level
const getAnalyticsIconSize = (zoom: number = 11): number => {
  const size = 20 + Math.max(0, Math.min(6, zoom - 11)) * (20 / 6);
  return Math.round(size);
};

const createAnalyticsDivIcon = (
  analytics: AnalyticsData,
  zoom: number
): L.DivIcon => {
  const dataToShow =
    analytics.type === AnalyticsDataType.StudentsUa
      ? `${analytics.percentage?.toFixed(0)}%`
      : `${analytics.count}`;

  const iconSize = getAnalyticsIconSize(zoom);
  const iconAnchor = iconSize / 2;

  return L.divIcon({
    className:
      analytics.type === AnalyticsDataType.StudentsUa
        ? "ua-marker"
        : "npi-marker",
    html: `<div style="background: ${getColorByPercentage(
      analytics.percentage ?? 0
    )};">
      ${dataToShow}
    </div>`,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconAnchor, iconAnchor],
  });
};

export const updateAnalyticsMarkerForZoom = (
  markerInfo: AnalyticsMarkerInfo & {
    marker: L.Marker;
    line: L.Polyline;
  },
  zoom: number
) => {
  const schoolPosition: [number, number] = [
    markerInfo.school.position?.lat ?? defaultPosition[0],
    markerInfo.school.position?.lng ?? defaultPosition[1],
  ];

  const newPosition = getAnalyticsMarkerPosition(
    schoolPosition[0],
    schoolPosition[1],
    markerInfo.markerIndex,
    markerInfo.totalMarkers,
    zoom
  );

  markerInfo.marker.setLatLng(newPosition);
  markerInfo.line.setLatLngs([newPosition, schoolPosition]);
  markerInfo.marker.setIcon(createAnalyticsDivIcon(markerInfo.analytics, zoom));
};

//Calculate color from green (0%) to red (100%)
export function getColorByPercentage(percentage: number): string {
  const colorStops = [
    { percent: 0, r: 76, g: 255, b: 0 }, // bright green
    { percent: 40, r: 255, g: 255, b: 0 }, // bright yellow
    { percent: 65, r: 255, g: 165, b: 0 }, // orange
    { percent: 85, r: 255, g: 50, b: 50 }, // red
    { percent: 100, r: 200, g: 0, b: 0 }, // dark red
  ];
  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (
      percentage >= colorStops[i].percent &&
      percentage <= colorStops[i + 1].percent
    ) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }

  const range = upperStop.percent - lowerStop.percent;
  const ratio = range === 0 ? 0 : (percentage - lowerStop.percent) / range;

  const r = Math.round(lowerStop.r + (upperStop.r - lowerStop.r) * ratio);
  const g = Math.round(lowerStop.g + (upperStop.g - lowerStop.g) * ratio);
  const b = Math.round(lowerStop.b + (upperStop.b - lowerStop.b) * ratio);

  const toHex = (value: number): string => {
    const hex = value.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const createAnalyticsMarker = (
  school: School,
  analytics: AnalyticsData,
  schoolColor: string,
  markerIndex: number,
  totalMarkers: number,
  zoom: number = 11
): { marker: L.Marker; line: L.Polyline } => {
  const schoolPosition: [number, number] = [
    school.position?.lat ?? defaultPosition[0],
    school.position?.lng ?? defaultPosition[1],
  ];

  // Calculate dynamic position based on zoom and marker index
  const markerPosition: [number, number] = getAnalyticsMarkerPosition(
    schoolPosition[0],
    schoolPosition[1],
    markerIndex,
    totalMarkers,
    zoom
  );

  const tooltip = L.tooltip({
    direction: "top",
    content: `<div style="text-align: center;">
    <strong>${school.name}</strong><br>
    <div> ${
      analytics.type === AnalyticsDataType.StudentsUa
        ? texts.analyticsUaStudents
        : texts.analyticsConsultationsNpi
    }</div>
    ${
      analytics.type === AnalyticsDataType.StudentsUa
        ? `${analytics.percentage?.toFixed(0)}% (${analytics.count})`
        : `${analytics.count}`
    }
  </div>`,
    opacity: 1,
  });

  const marker = L.marker(markerPosition, {
    icon: createAnalyticsDivIcon(analytics, zoom),
    riseOnHover: true,
  }).bindTooltip(tooltip);

  const line = L.polyline([markerPosition, schoolPosition], {
    color: schoolColor,
    weight: 2,
    opacity: 1,
    interactive: false,
  });

  return { marker, line };
};

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
  analyticsData,
  analyticsUaLayerGroup,
  analyticsNpiLayerGroup,
  options,
  currentZoom,
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
  analyticsData: AnalyticsData[];
  analyticsUaLayerGroup?: LayerGroup;
  analyticsNpiLayerGroup?: LayerGroup;
  options: MapOptions;
  currentZoom?: number;
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

  if (
    analyticsData?.length &&
    analyticsUaLayerGroup &&
    analyticsNpiLayerGroup
  ) {
    const analyticsBySchool: Record<string, AnalyticsData[]> = {};

    analyticsData.forEach((analytics) => {
      const schoolIzo = String(analytics.school);
      if (!analyticsBySchool[schoolIzo]) {
        analyticsBySchool[schoolIzo] = [];
      }
      analyticsBySchool[schoolIzo].push(analytics);
    });

    Object.entries(analyticsBySchool).forEach(
      ([schoolIzo, schoolAnalytics]) => {
        const school = data.municipalities
          .flatMap((m) => m.areas)
          .flatMap((a) => a.schools)
          .find((s) => s.izo === schoolIzo);

        if (!school) return;

        const totalMarkers = schoolAnalytics.length;

        const zoom = currentZoom ?? 11;

        schoolAnalytics.forEach((analytics, index) => {
          const { marker, line } = createAnalyticsMarker(
            school,
            analytics,
            schoolColors[school.izo],
            index,
            totalMarkers,
            zoom
          );

          const targetGroup =
            analytics.type === AnalyticsDataType.StudentsUa
              ? analyticsUaLayerGroup
              : analyticsNpiLayerGroup;

          targetGroup.addLayer(line);
          targetGroup.addLayer(marker);

          // Info for easier resize during zoom changes
          const analyticsMarker = marker as AnalyticsMarker;
          analyticsMarker.analyticsInfo = {
            school,
            analytics,
            schoolColor: schoolColors[school.izo],
            markerIndex: index,
            totalMarkers,
          };
          analyticsMarker.analyticsLine = line;
        });
      }
    );
  }
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

export const createTempMarker = (item: SuggestionItem) => {
  return new L.Marker([item.position.lat, item.position.lon], {
    icon: tempMarkerIcon,
  });
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

const publicIconElementary = createSvgIcon("#03b703");
const publicIconKindergarten = createSvgIcon("#155dfc");
const notReadyIcon = createSvgIcon("#999");
const tempMarkerIcon = createSvgIcon("#e43f16");

export const createCityMarker = (
  city: CityOnMap,
  cityMarkers: Record<string, Marker>,
  citiesMap: Record<string, CityOnMap>,
  bounds: L.LatLngBounds,
  schoolType: SchoolType
) => {
  const markerIcon =
    schoolType === SchoolType.Elementary
      ? publicIconElementary
      : publicIconKindergarten;

  const marker = L.marker([city.lat, city.lng], {
    icon: city.isPublished ? markerIcon : notReadyIcon,
  }).bindPopup(
    `<div class="flex flex-col gap-2 items-stretch"><h4 class="text-base text-center font-title">${
      city.name
    }</h4>${
      city.isPublished
        ? `${createCityMarkerButtons(city.code, schoolType)}`
        : "zatím není připraveno"
    }</div>`
  );
  marker.setZIndexOffset(city.isPublished ? 1000 : 900);
  cityMarkers[city.code] = marker;
  citiesMap[city.code] = city;
  bounds.extend(marker.getLatLng());
  return marker;
};

export const createAnalyticsCityMarker = (
  city: CityOnMap,
  cityMarkers: Record<string, Marker>,
  citiesMap: Record<string, CityOnMap>,
  bounds: L.LatLngBounds,
  cityData: Record<
    number,
    {
      earlySchoolLeavers?: AnalyticsData;
      populationDensity?: AnalyticsData;
      socialExclusionIndex?: AnalyticsData;
    }
  >
) => {
  const info = cityData[city.code] || {};

  const cityIcon = createSvgIcon(
    getColorByPercentage(info.socialExclusionIndex?.percentage ?? 0)
  );

  const marker = L.marker([city.lat, city.lng], {
    icon: info.socialExclusionIndex?.count ? cityIcon : notReadyIcon,
  }).bindPopup(
    `<div class="flex flex-col gap-2 items-stretch"><h4 class="text-base text-center font-title">${
      city.name
    }</h4>
      <ul>
        ${
          info.populationDensity?.count
            ? `<li>${texts.population}: ${info.populationDensity.count}</li>`
            : ""
        }
        ${
          info.socialExclusionIndex?.count
            ? `<li>${texts.isv}: ${info.socialExclusionIndex.count}</li>`
            : ""
        }
        ${
          info.earlySchoolLeavers?.count
            ? `<li>${texts.earlySchoolLeavers}: ${info.earlySchoolLeavers.count}</li>`
            : ""
        }
      </ul>
      <div class="city-data" data-city="${city.code}"></div>
      </div>`
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

const createCityMarkerButtons = (cityCode: number, schoolType: SchoolType) => `
<div class="flex flex-col gap-2"><a href="${getRootPathBySchoolType(
  schoolType,
  true
)}/m/${cityCode}?controls=1" target="_blank" class="city-marker ${getButtonClasses()}">
  ${getNewWindowHeroicon()} Zobrazit v novém okně
</a><a href="/api/ordinances/download/by-city-code/${cityCode}" target="_blank" class="city-marker ${getButtonClasses(
  "secondary"
)}">
  ${getDownloadHeroicon()} Stáhnout vyhlášku
</a></div>`;

const getButtonClasses = (variant: ButtonVariant = "default") => {
  return buttonVariants({ size: "xs", variant });
};

const getDownloadHeroicon =
  () => `<svg class="inline-block w-4 h-4 relative" style="top: -1px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
</svg>`;

const getNewWindowHeroicon =
  () => `<svg class="inline-block w-4 h-4 relative" style="top: -1px;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
</svg>`;
