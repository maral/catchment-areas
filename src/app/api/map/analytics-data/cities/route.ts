import { SchoolType } from "@/types/basicTypes";
import { getAnalyticsDataForCities } from "@/utils/server/analyticsData";
import { texts } from "@/utils/shared/texts";
import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../[...remult]/api";

export async function GET() {
  const analyticsDataForMap = await api.withRemult(
    async () => await getAnalyticsDataForCities()
  );
  if (analyticsDataForMap === null) {
    return NextResponse.json(
      { success: false, message: texts.analyticsDataNotFound },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { success: true, data: analyticsDataForMap },
    { status: 200 }
  );
}
