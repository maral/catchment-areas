import { SchoolType } from "@/types/basicTypes";
import { getAnalyticsData } from "@/utils/server/analyticsData";
import { texts } from "@/utils/shared/texts";
import { NextRequest, NextResponse } from "next/server";
import { api } from "../../[...remult]/api";

interface RequestBody {
  cityCodes: number[];
  schoolType: SchoolType;
}

export async function POST(request: NextRequest) {
  const { cityCodes, schoolType }: RequestBody = await request.json();

  const analyticsDataForMap = await api.withRemult(
    async () => await getAnalyticsData(cityCodes, schoolType)
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
