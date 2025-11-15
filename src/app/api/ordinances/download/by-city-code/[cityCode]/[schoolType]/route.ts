import { api } from "@/app/api/[...remult]/api";
import { City } from "@/entities/City";
import { Ordinance } from "@/entities/Ordinance";
import { NextRequest, NextResponse } from "next/server";
import { remult } from "remult";
import { downloadOrdinance } from "../../../download";
import { getSchoolTypeCode } from "@/entities/School";

export async function GET(
  _: NextRequest,
  props: { params: Promise<{ cityCode: string; schoolType: string }> }
) {
  const params = await props.params;
  const ordinanceId = await api.withRemult(async () => {
    const schoolTypeCode = getSchoolTypeCode(params.schoolType);
    const city = await remult.repo(City).findId(params.cityCode);
    if (!city) {
      return null;
    }

    const ordinance = await remult
      .repo(Ordinance)
      .findFirst({ city, isActive: true, schoolType: schoolTypeCode });
    return ordinance?.id ?? null;
  });

  if (ordinanceId === null) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  return downloadOrdinance(ordinanceId);
}
