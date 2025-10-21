import { SchoolType } from "@/types/basicTypes";
import { getAnalyticsSummaryForCity } from "@/utils/server/analyticsData";
import { texts } from "@/utils/shared/texts";
import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../[...remult]/api";

interface RequestBody {
  cityCode: number;
  schoolType: SchoolType;
}

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const cityCode = Number(data.get("cityCode"));
  const schoolType = Number(data.get("schoolType"));

  const response = await api.withRemult(
    async () => await getAnalyticsSummaryForCity(cityCode, schoolType)
  );

  if (response === null) {
    return NextResponse.json(
      { success: false, message: texts.analyticsDataNotFound },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, data: response }, { status: 200 });
}
