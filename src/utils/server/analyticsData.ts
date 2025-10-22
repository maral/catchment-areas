import { api } from "@/app/api/[...remult]/api";
import { AnalyticsData } from "@/entities/AnalyticsData";
import { School } from "@/entities/School";
import { CitiesAnalyticsData, LegendItem } from "@/types/mapTypes";
import { AnalyticsDataType, SchoolType } from "@/types/basicTypes";
import ExcelJS from "exceljs";
import { KnexDataProvider } from "remult/remult-knex";
import { texts } from "@/utils/shared/texts";
interface ExtractedRowData {
  redIzo: string | null;
  schoolType: SchoolType | null;
  value: number;
  cityCode: number | null;
}

const ANALYTICS_DATA_SETTINGS: Record<
  AnalyticsDataType,
  {
    headerRowIndex: number;
    sheetIndex: number;
    redIzoIndex: number | null;
    schoolTypeIndex: number | null;
    valueIndex: number; // For Kindergarten
    valueTwoIndex: number; // For Elementary
    cityCodeIndex: number | null;
  }
> = {
  [AnalyticsDataType.StudentsTotal]: {
    headerRowIndex: 4,
    sheetIndex: 0,
    redIzoIndex: 3,
    schoolTypeIndex: 15,
    valueIndex: 21,
    valueTwoIndex: 29,
    cityCodeIndex: null,
  },
  [AnalyticsDataType.StudentsUa]: {
    headerRowIndex: 4,
    sheetIndex: 0,
    redIzoIndex: 3,
    schoolTypeIndex: 12,
    valueIndex: 14,
    valueTwoIndex: 16,
    cityCodeIndex: null,
  },
  [AnalyticsDataType.ConsultationsNpi]: {
    headerRowIndex: 3,
    sheetIndex: 0,
    redIzoIndex: 1,
    schoolTypeIndex: 9,
    valueIndex: 26,
    valueTwoIndex: 26,
    cityCodeIndex: null,
  },
  [AnalyticsDataType.SocialExclusionIndex]: {
    headerRowIndex: 3,
    sheetIndex: 0,
    redIzoIndex: null,
    schoolTypeIndex: null,
    valueIndex: 12,
    valueTwoIndex: 12,
    cityCodeIndex: 1,
  },
  [AnalyticsDataType.PopulationDensity]: {
    headerRowIndex: 3,
    sheetIndex: 0,
    redIzoIndex: null,
    schoolTypeIndex: null,
    valueIndex: 11,
    valueTwoIndex: 11,
    cityCodeIndex: 1,
  },
  [AnalyticsDataType.EarlySchoolLeavers]: {
    headerRowIndex: 3,
    sheetIndex: 0,
    redIzoIndex: null,
    schoolTypeIndex: null,
    valueIndex: 17,
    valueTwoIndex: 17,
    cityCodeIndex: 1,
  },
};

function getSchoolTypeFromCell(type: string): SchoolType | null {
  const normalizedType = type?.trim();
  if (normalizedType === "MS" || normalizedType === "Mateřská škola")
    return SchoolType.Kindergarten;
  if (normalizedType === "ZS" || normalizedType === "Základní škola")
    return SchoolType.Elementary;

  return null;
}

export async function extractDataFromSheet(
  file: File,
  dataType: AnalyticsDataType
): Promise<ExtractedRowData[]> {
  const {
    headerRowIndex,
    sheetIndex,
    redIzoIndex,
    schoolTypeIndex,
    valueIndex,
    valueTwoIndex,
    cityCodeIndex,
  } = ANALYTICS_DATA_SETTINGS[dataType];

  try {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    if (workbook.worksheets.length <= sheetIndex) {
      throw new Error(`Sheet at index ${sheetIndex} does not exist.`);
    }

    const data: ExtractedRowData[] = [];
    const worksheet = workbook.worksheets[sheetIndex];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > headerRowIndex) {
        let redIzo = null;
        let redIzoCell = null;
        let cityCodeCell = null;
        let schoolTypeCell = null;
        let schoolType = null;
        let cityCode = null;

        if (redIzoIndex !== null) {
          redIzoCell = row.getCell(redIzoIndex);
          if (!redIzoCell.value) return;
          redIzo = String(redIzoCell.value).trim();
        }
        if (schoolTypeIndex !== null) {
          schoolTypeCell = row.getCell(schoolTypeIndex);
          if (!schoolTypeCell.value) return;
          schoolType = getSchoolTypeFromCell(String(schoolTypeCell.value));
          if (schoolType === null) return;
        }

        const valuePosition =
          schoolTypeIndex === null || schoolType === SchoolType.Kindergarten
            ? valueIndex
            : valueTwoIndex;

        const valueCell = row.getCell(valuePosition);

        if (!valueCell.value) return;

        const value = Number(valueCell.value);
        if (isNaN(value) || value < 0) return;

        if (cityCodeIndex !== null) {
          cityCodeCell = row.getCell(cityCodeIndex);
          if (!cityCodeCell.value) return;
          cityCode = Number(cityCodeCell.value);
          if (isNaN(cityCode) || cityCode < 0) return;
        }

        data.push({
          redIzo,
          schoolType,
          value,
          cityCode,
        });
      }
    });
    console.log("Extracted rows:", data.length, data);
    return data;
  } catch (err) {
    console.error("Failed to extract data from Excel sheet:", err);
    return [];
  }
}

export async function insertAnalyticsDataAndGetResponse(
  data: ExtractedRowData[],
  dataType: AnalyticsDataType
): Promise<{
  success: boolean;
  processedCount: number;
  message: string;
}> {
  const processedCount = await insertAnalyticsData(data, dataType);

  if (processedCount === 0) {
    return {
      success: false,
      processedCount,
      message: "No data inserted to DB or invalid data",
    };
  }

  return {
    success: true,
    processedCount,
    message: `Successfully inserted ${processedCount} records`,
  };
}

async function insertAnalyticsData(
  data: ExtractedRowData[],
  dataType: AnalyticsDataType
): Promise<number> {
  return await api.withRemult(async () => {
    try {
      // Delete all existing data for this type (I assume we always import whole batch for all schools so no need to look for old data and edit them)
      const knex = KnexDataProvider.getDb();
      await knex("analytics_data")
        .where({ type: Number(dataType) })
        .del();

      // Prepare data for insert to DB
      const sqlInsertData: Array<{
        school_izo: string | null;
        type: number;
        count: number;
        percentage: number | null;
        school_type: SchoolType | null;
        city_code: number | null;
      }> = [];

      if (
        dataType === AnalyticsDataType.SocialExclusionIndex ||
        dataType === AnalyticsDataType.PopulationDensity ||
        dataType === AnalyticsDataType.EarlySchoolLeavers
      ) {
        const relevantCities = await knex("city as c")
          .where("c.school_count", ">=", 2)
          .orWhere("c.kindergarten_count", ">=", 2)
          .select("c.*");

        const citiesMap = new Map<number, any>();
        for (const city of relevantCities) {
          citiesMap.set(city.code, city);
        }

        let maxValue = 0;
        let percentage = null;

        if (dataType === AnalyticsDataType.SocialExclusionIndex) {
          maxValue = Math.max(...data.map((row) => row.value));
        }

        for (const row of data) {
          if (row.cityCode && citiesMap.has(row.cityCode)) {
            if (
              dataType === AnalyticsDataType.SocialExclusionIndex &&
              maxValue > 0
            ) {
              percentage = Number(((row.value / maxValue) * 100).toFixed(2));
            } else {
              percentage = null;
            }

            sqlInsertData.push({
              school_izo: null,
              type: Number(dataType),
              count: row.value,
              percentage,
              school_type: null,
              city_code: row.cityCode,
            });
          }
        }
      } else {
        // Load schools from cities with 2+ schools of the relevant type (I assume that school count doesn't change much if at all, so we can filter it here and not at every api request)
        const relevantSchools = await knex("school as s")
          .join("school_founder as sf", "s.izo", "sf.school_izo")
          .join("founder as f", "sf.founder_id", "f.id")
          .join("city as c", "f.city_code", "c.code")
          .where("c.school_count", ">=", 2)
          .orWhere("c.kindergarten_count", ">=", 2)
          .select("s.*", "c.code as city_code");

        const schoolsMap = new Map<string, School & { city_code: number }>();
        for (const school of relevantSchools) {
          const key = `${school.redizo}:${school.type}`;
          schoolsMap.set(key, school);
        }
        let globalMaxValue = 0;

        // Find N for ConsultationsNpi (1-N scale to show in map)
        if (dataType === AnalyticsDataType.ConsultationsNpi) {
          globalMaxValue = Math.max(...data.map((row) => row.value));
        }

        for (const row of data) {
          const schoolKey = `${row.redIzo}:${row.schoolType}`;
          const school = schoolsMap.get(schoolKey);

          if (school) {
            let percentage = null;

            if (
              dataType === AnalyticsDataType.ConsultationsNpi &&
              globalMaxValue > 0
            ) {
              percentage = Number(
                ((row.value / globalMaxValue) * 100).toFixed(2)
              );
            }

            sqlInsertData.push({
              school_izo: school.izo,
              type: Number(dataType),
              count: row.value,
              percentage,
              school_type: school.type,
              city_code: school.city_code,
            });
          }
        }
      }

      if (sqlInsertData.length > 0) {
        await knex("analytics_data").insert(sqlInsertData);
      }

      // If updated data is important for percentage calculation then recalculate
      if (
        dataType === AnalyticsDataType.StudentsTotal ||
        dataType === AnalyticsDataType.StudentsUa
      ) {
        await recalculatePercentagesInternal(knex);
      }

      return sqlInsertData.length;
    } catch (error) {
      console.error("Error inserting analytics data:", error);
      return 0;
    }
  });
}

async function recalculatePercentagesInternal(knex: any): Promise<void> {
  await knex.raw(
    `
    UPDATE analytics_data ua
    LEFT JOIN analytics_data total ON ua.school_izo = total.school_izo AND total.type = ?
    SET ua.percentage = CASE 
      WHEN total.count > 0 THEN ROUND((ua.count / total.count) * 100, 2)
      ELSE NULL
    END
    WHERE ua.type = ?
  `,
    [AnalyticsDataType.StudentsTotal, AnalyticsDataType.StudentsUa]
  );
}

export async function getAnalyticsData(
  cityCodes: number[],
  schoolType: SchoolType
): Promise<AnalyticsData[]> {
  try {
    return await api.withRemult(async () => {
      const knex = KnexDataProvider.getDb();

      const result = await knex("analytics_data")
        .where("city_code", "in", cityCodes)
        .where("school_type", schoolType)
        .whereIn("type", [
          AnalyticsDataType.StudentsUa,
          AnalyticsDataType.ConsultationsNpi,
        ]);

      return result.map(
        (row: any): AnalyticsData => ({
          id: row.id,
          school: row.school_izo,
          type: row.type,
          percentage: row.percentage,
          count: row.count,
          schoolType: row.school_type,
          city: row.city_code,
        })
      );
    });
  } catch (error) {
    console.error("Failed to load analytics data:", error);
    return [];
  }
}

export async function getAnalyticsDataForCities(): Promise<CitiesAnalyticsData> {
  try {
    return await api.withRemult(async () => {
      const knex = KnexDataProvider.getDb();

      // Get only city-level data (no school_izo)
      const result = await knex("analytics_data")
        .whereIn("type", [
          AnalyticsDataType.EarlySchoolLeavers,
          AnalyticsDataType.PopulationDensity,
          AnalyticsDataType.SocialExclusionIndex,
        ])
        .orderBy("city_code");

      const groupedData: Record<
        number,
        {
          earlySchoolLeavers?: AnalyticsData;
          populationDensity?: AnalyticsData;
          socialExclusionIndex?: AnalyticsData;
        }
      > = {};

      result.forEach((row: any) => {
        const cityCode = row.city_code;

        if (!groupedData[cityCode]) {
          groupedData[cityCode] = {};
        }

        const analyticsData: AnalyticsData = {
          id: row.id,
          school: row.school_izo,
          type: row.type,
          percentage: row.percentage,
          count: row.count,
          schoolType: row.school_type,
          city: row.city_code,
        };

        switch (row.type) {
          case AnalyticsDataType.EarlySchoolLeavers:
            groupedData[cityCode].earlySchoolLeavers = analyticsData;
            break;
          case AnalyticsDataType.PopulationDensity:
            groupedData[cityCode].populationDensity = analyticsData;
            break;
          case AnalyticsDataType.SocialExclusionIndex:
            groupedData[cityCode].socialExclusionIndex = analyticsData;
            break;
        }
      });

      return groupedData;
    });
  } catch (error) {
    console.error("Failed to load analytics data for cities:", error);
    return {};
  }
}

export async function getAnalyticsSummaryForCity(
  cityCode: number,
  schoolType: SchoolType
): Promise<{
  totalStudents: number;
  totalStudentsUa: number;
  percentageStudentsUa: number;
  consultationsNpi: number;
} | null> {
  try {
    return await api.withRemult(async () => {
      const knex = KnexDataProvider.getDb();

      // Get school data for the specific city and school type
      const schoolData = await knex("analytics_data")
        .where("city_code", cityCode)
        .where((builder) => {
          builder.where("school_type", schoolType).orWhereNull("school_type");
        })
        .whereIn("type", [
          AnalyticsDataType.StudentsTotal,
          AnalyticsDataType.StudentsUa,
          AnalyticsDataType.ConsultationsNpi,
        ]);

      const sums = {
        totalStudents: 0,
        totalStudentsUa: 0,
        consultationsNpi: 0,
      };

      schoolData.forEach((row: any) => {
        switch (row.type) {
          case AnalyticsDataType.StudentsTotal:
            sums.totalStudents += row.count;
            break;
          case AnalyticsDataType.StudentsUa:
            sums.totalStudentsUa += row.count;
            break;
          case AnalyticsDataType.ConsultationsNpi:
            sums.consultationsNpi += row.count;
            break;
        }
      });

      const percentageTotalStudentsUa =
        sums.totalStudents > 0
          ? Number(
              ((sums.totalStudentsUa / sums.totalStudents) * 100).toFixed(2)
            )
          : 0;

      return {
        totalStudents: sums.totalStudents,
        totalStudentsUa: sums.totalStudentsUa,
        percentageStudentsUa: percentageTotalStudentsUa,
        consultationsNpi: sums.consultationsNpi,
      };
    });
  } catch (error) {
    console.error("Failed to load analytics summary for city:", error);
    return null;
  }
}

export async function getLegendDataForSchoolType(
  schoolType: SchoolType
): Promise<LegendItem[]> {
  try {
    return await api.withRemult(async () => {
      const knex = KnexDataProvider.getDb();

      const result = await knex("analytics_data")
        .select(
          "type",
          knex.raw("MIN(count) as min_value"),
          knex.raw("MAX(count) as max_value")
        )
        .where((builder) => {
          builder
            .where({
              type: AnalyticsDataType.StudentsUa,
              school_type: schoolType,
            })
            .orWhere({
              type: AnalyticsDataType.ConsultationsNpi,
              school_type: schoolType,
            })
            .orWhere({
              type: AnalyticsDataType.SocialExclusionIndex,
              school_type: null,
            });
        })
        .groupBy("type");

      const legendItems: LegendItem[] = [];

      result.forEach((row: any) => {
        const minValue = Math.floor(row.min_value || 0);
        const maxValue = Math.ceil(row.max_value || 0);

        switch (row.type) {
          case AnalyticsDataType.ConsultationsNpi:
            // Real count values (1-N)
            legendItems.push({
              title: texts.analyticsConsultationsNpi,
              minValue: String(Math.max(minValue, 1)),
              maxValue: String(maxValue),
              icon: `<div class="npi-marker" style="height: 12px; width: 12px;"><div ></div></div>`,
              description: texts.analyticsConsultationsNpiDescription,
            });
            break;

          case AnalyticsDataType.StudentsUa:
            // Percentage values (0-100%)
            legendItems.push({
              title: texts.analyticsUaStudents,
              minValue: "0 %",
              maxValue: "100 %",
              icon: `<div class="ua-marker" style="height: 12px; width: 12px; "><div></div></div>`,
              description: texts.analyticsUaStudentsDescription,
            });
            break;

          case AnalyticsDataType.SocialExclusionIndex:
            // Real count values (index)
            legendItems.push({
              title: texts.isv,
              minValue: "0",
              maxValue: String(maxValue),

              icon: ` <svg
                      width="12"
                      height="12"
                      viewBox="0 0 100 100"
                      version="1.1"
                      preserveAspectRatio="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M0 0 L50 100 L100 0 Z" fill="gray"></path>
                    </svg>`,
              description: undefined,
            });
            break;
        }
      });

      return legendItems;
    });
  } catch (error) {
    console.error("Failed to load legend data:", error);
    return [];
  }
}
