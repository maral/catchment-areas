import { AnalyticsData } from "@/entities/AnalyticsData";
import { SchoolType, AnalyticsDataType } from "@/types/basicTypes";
import { remult } from "remult";

const analyticsRepo = remult.repo(AnalyticsData);

export async function loadAnalyticsData(
  schoolType: SchoolType | undefined,
  dataType: AnalyticsDataType | undefined
) {
  const analyticsData = await analyticsRepo.find({
    where: schoolType !== undefined ? { schoolType: schoolType } : {},
    load: (item) => [item.school],
  });

  const groupedData = new Map();

  for (const record of analyticsData) {
    const schoolKey = `${record.school.izo}:${record.school.type}`;

    if (!groupedData.has(schoolKey)) {
      groupedData.set(schoolKey, {
        school: record.school,
        analytics: {},
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
          case AnalyticsDataType.StudentsTotal:
            return analytics.total;
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
