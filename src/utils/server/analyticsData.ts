import { api } from "@/app/api/[...remult]/api";
import { AnalyticsData } from "@/entities/AnalyticsData";
import { School } from "@/entities/School";
import { AnalyticsDataType, SchoolType } from "@/types/basicTypes";
import ExcelJS from "exceljs";
import { KnexDataProvider } from "remult/remult-knex";
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
