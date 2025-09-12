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
    load: (item) => [item.school, item.city],
  });

  const groupedData = new Map();

  for (const record of analyticsData) {
    const schoolKey = `${record.school.izo}:${record.school.type}`;

    if (!groupedData.has(schoolKey)) {
      groupedData.set(schoolKey, {
        school: record.school,
        analytics: {},
        city: record.city,
      });
    }

    const schoolData = groupedData.get(schoolKey);

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

    schoolData.analytics[typeName] = {
      count: record.count,
      ...(record.percentage !== null && { percentage: record.percentage }),
    };
  }
  const completeSchools = Array.from(groupedData.values()).filter(
    (schoolData) => {
      const analytics = schoolData.analytics;

      // If data type is specified, filter by it
      if (dataType !== undefined) {
        switch (dataType) {
          case AnalyticsDataType.StudentsUa:
            return analytics.studentsUa;
          case AnalyticsDataType.ConsultationsNpi:
            return analytics.consultationsNpi;
          default:
            return false;
        }
      }

      // If data type is not specified, return schools with any relevant data
      return analytics.studentsUa || analytics.consultationsNpi;
    }
  );

  return completeSchools.sort((a, b) =>
    a.school.name.localeCompare(b.school.name)
  );
}
