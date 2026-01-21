import { SchoolType } from "@/types/basicTypes";
import { texts } from "@/utils/shared/texts";
import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../[...remult]/api";
import { getSchoolsForAnalyticsMapByCityCodes } from "@/utils/server/analyticsData";

interface RequestBody {
  cityCodes: number[];
  schoolType: SchoolType;
}

export async function POST(request: NextRequest) {
  const { cityCodes, schoolType }: RequestBody = await request.json();

  const dataForMapByCityCodes = await api.withRemult(
    async () =>
      await getSchoolsForAnalyticsMapByCityCodes(cityCodes, schoolType)
  );

  if (dataForMapByCityCodes === null) {
    return NextResponse.json(
      { success: false, message: texts.founderNotFound },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { success: true, dataForMapByCityCodes },
    { status: 200 }
  );
}
