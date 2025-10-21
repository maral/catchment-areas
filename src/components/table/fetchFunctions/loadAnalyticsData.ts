import { AnalyticsData } from "@/entities/AnalyticsData";
import { AnalyticsDataType, SchoolType } from "@/types/basicTypes";
import { remult } from "remult";

const analyticsRepo = remult.repo(AnalyticsData);

export async function loadAnalyticsData(
  schoolType?: SchoolType,
  dataType?: AnalyticsDataType,
  city?: number
) {
  const whereCondition: any = {};
  if (schoolType !== undefined) {
    whereCondition.schoolType = schoolType;
  }
  if (city !== undefined) {
    whereCondition.city = city;
  }

  const analyticsData = await analyticsRepo.find({
    where: whereCondition,
    load: (item) => {
      const toLoad = [];
      if (item.school) toLoad.push(item.school);
      if (item.city) toLoad.push(item.city);
      return toLoad;
    },
  });

  // Group by city code
  const citiesMap = new Map();

  for (const record of analyticsData) {
    const cityCode = record.city?.code;
    if (!cityCode) continue;

    // Initialize city entry if doesn't exist
    if (!citiesMap.has(cityCode)) {
      citiesMap.set(cityCode, {
        city: record.city,
        socialExclusionIndex: null,
        populationDensity: null,
        earlySchoolLeavers: null,
        schools: [],
      });
    }

    const cityEntry = citiesMap.get(cityCode);

    if (record.school) {
      let schoolEntry = cityEntry.schools.find(
        (s: any) =>
          s.school.izo === record.school!.izo &&
          s.school.type === record.school!.type
      );

      if (!schoolEntry) {
        schoolEntry = {
          school: record.school,
          analytics: {},
        };
        cityEntry.schools.push(schoolEntry);
      }

      let typeName = "";
      switch (record.type) {
        case AnalyticsDataType.StudentsTotal:
          typeName = "total";
          break;
        case AnalyticsDataType.StudentsUa:
          typeName = "studentsUa";
          break;
        case AnalyticsDataType.ConsultationsNpi:
          typeName = "consultationsNpi";
          break;
      }

      if (typeName) {
        schoolEntry.analytics[typeName] = {
          count: record.count,
          ...(record.percentage !== null && { percentage: record.percentage }),
        };
      }
    } else {
      // City data
      switch (record.type) {
        case AnalyticsDataType.SocialExclusionIndex:
          cityEntry.socialExclusionIndex = { count: record.count };
          break;
        case AnalyticsDataType.PopulationDensity:
          cityEntry.populationDensity = { count: record.count };
          break;
        case AnalyticsDataType.EarlySchoolLeavers:
          cityEntry.earlySchoolLeavers = { count: record.count };
          break;
      }
    }
  }

  let result = Array.from(citiesMap.values());

  if (dataType !== undefined) {
    result = result
      .map((cityEntry: any) => {
        const filteredSchools = cityEntry.schools.filter((s: any) => {
          switch (dataType) {
            case AnalyticsDataType.StudentsUa:
              return s.analytics.studentsUa;
            case AnalyticsDataType.ConsultationsNpi:
              return s.analytics.consultationsNpi;
            default:
              return true;
          }
        });

        return {
          ...cityEntry,
          schools: filteredSchools,
        };
      })
      .filter((cityEntry: any) => cityEntry.schools.length > 0);
  }

  result.forEach((cityEntry: any) => {
    cityEntry.schools.sort((a: any, b: any) =>
      a.school.name.localeCompare(b.school.name)
    );
  });

  result.sort((a: any, b: any) => a.city.name.localeCompare(b.city.name));

  return result;
}
