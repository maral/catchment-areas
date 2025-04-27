// Centralized status configuration

import {
  City,
  CityStatus,
  getStatusPropertyBySchoolType,
} from "@/entities/City";
import { SchoolType } from "@/types/basicTypes";
import { texts } from "../shared/texts";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";

export interface StatusConfig {
  label: string;
  color: string;
}

export const getStatusConfig = (status: ProgressStatus): StatusConfig => {
  switch (status) {
    case "published":
      return {
        label: texts.statusPublished,
        color: "bg-green-200",
      };
    case "newOrdinance":
      return {
        label: texts.newOrdinances,
        color: "bg-amber-200",
      };
    case "inProgress":
      return {
        label: texts.statusInProgress,
        color: "bg-slate-200",
      };
    case "noOrdinance":
      return {
        label: texts.statusNoOrdinance,
        color: "bg-red-200",
      };
    case "noExistingOrdinance":
      return {
        label: texts.statusNoExistingOrdinance,
        color: "bg-white",
      };
  }
};

export type ProgressStatus =
  | "published"
  | "inProgress"
  | "noOrdinance"
  | "noExistingOrdinance"
  | "newOrdinance";

export const getProgressStatus = (
  city: City,
  schoolType: SchoolType,
  newOrdinanceMetadata: OrdinanceMetadata[]
): ProgressStatus => {
  const status = city[getStatusPropertyBySchoolType(schoolType)];
  if (newOrdinanceMetadata.some((o) => o.cityCode === city.code)) {
    return "newOrdinance";
  }
  switch (status) {
    case CityStatus.NoOrdinance:
      return "noOrdinance";
    case CityStatus.InProgress:
      return "inProgress";
    case CityStatus.Published:
      return "published";
    case CityStatus.NoExistingOrdinance:
      return "noExistingOrdinance";
  }

  return "noOrdinance";
};

export type StatusCount = {
  status: ProgressStatus;
  count: number;
};

export const calculateStatusCounts = (
  cities: City[],
  schoolType: SchoolType,
  newOrdinanceMetadata: OrdinanceMetadata[]
): StatusCount[] => {
  const counts: Map<ProgressStatus, number> = new Map([
    ["published", 0],
    ["newOrdinance", 0],
    ["inProgress", 0],
    ["noOrdinance", 0],
    ["noExistingOrdinance", 0],
  ]);

  // Count cities by status
  cities.forEach((city) => {
    const status = getProgressStatus(city, schoolType, newOrdinanceMetadata);
    counts.set(status, (counts.get(status) || 0) + 1);
  });

  // Convert to array format
  return Array.from(counts.entries())
    .map(([status, count]) => ({
      status,
      count,
    }))
    .filter(({ status }) => status !== "noExistingOrdinance");
};

export const calculateCompletionPercentage = (
  statusCounts: StatusCount[]
): number => {
  const notPlannedCount =
    statusCounts.find((s) => s.status === "noExistingOrdinance")?.count || 0;
  const doneCount =
    statusCounts.find((s) => s.status === "published")?.count || 0;
  const totalActionable =
    statusCounts.reduce((sum, item) => sum + item.count, 0) - notPlannedCount;

  return totalActionable > 0
    ? Math.round((doneCount / totalActionable) * 100)
    : 0;
};
