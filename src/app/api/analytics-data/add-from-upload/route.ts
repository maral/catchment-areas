import { getNotLoggedInResponse, isLoggedIn } from "@/utils/server/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  extractDataFromSheet,
  insertAnalyticsDataAndGetResponse,
} from "@/utils/server/analyticsData";
import { AnalyticsDataType } from "@/types/basicTypes";

export async function POST(req: NextRequest) {
  if (!(await isLoggedIn())) {
    return getNotLoggedInResponse();
  }

  const data = await req.formData();
  const file: File | null = data.get("file") as unknown as File;
  const dataType = Number(data.get("dataType"));

  if (
    !file ||
    file.type !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return NextResponse.json({ success: false });
  }

  let extractedData = [];

  if (dataType == AnalyticsDataType.SocialExclusionIndex) {
    const typesToExtract = [
      AnalyticsDataType.SocialExclusionIndex,
      AnalyticsDataType.PopulationDensity,
      AnalyticsDataType.EarlySchoolLeavers,
    ];
    const extractedDataArray = [];
    for (const type of typesToExtract) {
      const data = await extractDataFromSheet(file, type);
      if (data.length > 0) {
        extractedDataArray.push({ dataType: type, data });
      }
    }

    const responses = [];
    for (const item of extractedDataArray) {
      const response = await insertAnalyticsDataAndGetResponse(
        item.data,
        item.dataType
      );
      responses.push(response);
    }

    const insertedCountTotal = responses.reduce(
      (sum, r) => sum + r.processedCount,
      0
    );

    return NextResponse.json({
      success: responses.every((r) => r.success),
      message: `Successfully inserted ${insertedCountTotal} records`,
      processedCount: insertedCountTotal,
    });
  } else {
    extractedData = await extractDataFromSheet(file, dataType);
  }

  if (extractedData.length === 0) {
    return NextResponse.json({
      success: false,
      message: "No data extracted from file",
      processedCount: 0,
    });
  }

  const response = await insertAnalyticsDataAndGetResponse(
    extractedData,
    dataType
  );

  return NextResponse.json(response);
}
