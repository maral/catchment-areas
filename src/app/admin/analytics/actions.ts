"use server";

import { api } from "@/app/api/[...remult]/api";
import { loadAnalyticsData } from "@/components/table/fetchFunctions/loadAnalyticsData";
import { SchoolType } from "@/types/basicTypes";

export async function loadCitySchools(
  cityCode: number,
  schoolType?: SchoolType,
  dataType?: number,
) {
  const data = await api.withRemult(async () => {
    const result = await loadAnalyticsData(schoolType, dataType, cityCode);
    return result[0] || null;
  });

  if (!data) {
    return { schools: [] };
  }

  return { schools: data.schools };
}
