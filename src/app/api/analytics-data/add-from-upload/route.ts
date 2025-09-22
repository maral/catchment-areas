import { getNotLoggedInResponse, isLoggedIn } from "@/utils/server/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  extractDataFromSheet,
  insertAnalyticsDataAndGetResponse,
} from "@/utils/server/analyticsData";

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

  const extractedData = await extractDataFromSheet(file, dataType);

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
