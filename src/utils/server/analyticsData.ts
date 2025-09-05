import { api } from "@/app/api/[...remult]/api";
import { School } from "@/entities/School";
import { AnalyticsDataType, SchoolType } from "@/types/basicTypes";
import ExcelJS from "exceljs";
import { remult } from "remult";
import { KnexDataProvider } from "remult/remult-knex";

interface ExtractedRowData {
  redIzo: string;
  schoolType: SchoolType;
  value: number;
}

const ANALYTICS_DATA_SETTINGS: Record<
  AnalyticsDataType,
  {
    headerRowIndex: number;
    sheetIndex: number;
    redIzoIndex: number;
    schoolTypeIndex: number;
    valueIndex: number;
    valueTwoIndex: number;
  }
> = {
  [AnalyticsDataType.StudentsTotal]: {
    headerRowIndex: 4,
    sheetIndex: 0,
    redIzoIndex: 3,
    schoolTypeIndex: 15,
    valueIndex: 21,
    valueTwoIndex: 29,
  },
  [AnalyticsDataType.StudentsUa]: {
    headerRowIndex: 4,
    sheetIndex: 0,
    redIzoIndex: 3,
    schoolTypeIndex: 12,
    valueIndex: 14,
    valueTwoIndex: 16,
  },
  [AnalyticsDataType.ConsultationsNpi]: {
    headerRowIndex: 3,
    sheetIndex: 0,
    redIzoIndex: 1,
    schoolTypeIndex: 9,
    valueIndex: 26,
    valueTwoIndex: 26,
  },
};

function getSchoolTypeFromCell(type: string): SchoolType | null {
  const normalizedType = type?.trim();
  if (normalizedType === "MS" || normalizedType === "Mateřská škola")
    return SchoolType.Kindergarten;
  if (normalizedType === "ZŠ" || normalizedType === "Základní škola")
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
        const redIzoCell = row.getCell(redIzoIndex);
        const schoolTypeCell = row.getCell(schoolTypeIndex);

        if (!redIzoCell.value || !schoolTypeCell.value) return;

        const redIzo = String(redIzoCell.value).trim();
        const schoolType = getSchoolTypeFromCell(String(schoolTypeCell.value));

        if (schoolType === null) return;

        const valuePosition =
          schoolType === SchoolType.Kindergarten ? valueIndex : valueTwoIndex;
        const valueCell = row.getCell(valuePosition);

        if (!valueCell.value) return;

        const value = Number(valueCell.value);
        if (isNaN(value) || value < 0) return;

        data.push({
          redIzo,
          schoolType,
          value,
        });
      }
    });

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
      const schoolRepo = remult.repo(School);

      // Delete all existing data for this type (I assume we always import whole batch for all schools so no need to rewrite old data)
      const knex = KnexDataProvider.getDb();
      await knex("analytics_data")
        .where({ type: Number(dataType) })
        .del();

      // Load all schools from DB
      const allSchools = await schoolRepo.find();
      const schoolsMap = new Map<string, School>();
      for (const school of allSchools) {
        const key = `${school.redizo}:${school.type}`;
        schoolsMap.set(key, school);
      }

      // Prepare data for insert to DB
      const sqlInsertData: Array<{
        school_izo: string;
        type: number;
        count: number;
        percentage: number | null;
      }> = [];

      for (const row of data) {
        const schoolKey = `${row.redIzo}:${row.schoolType}`;
        const school = schoolsMap.get(schoolKey);

        if (school) {
          sqlInsertData.push({
            school_izo: school.izo,
            type: Number(dataType),
            count: row.value,
            percentage: null,
          });
        }
      }

      if (sqlInsertData.length > 0) {
        await knex("analytics_data").insert(sqlInsertData);
      }

      //If updated data is important for percentage calculation then recalculate
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
