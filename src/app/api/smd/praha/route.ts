import { api } from "@/app/api/[...remult]/api";
import { City } from "@/entities/City";
import { Ordinance } from "@/entities/Ordinance";
import { getSchoolTypeCode } from "@/entities/School";
import { getSmdTextResponse } from "@/utils/server/smdDownload";
import { NextResponse } from "next/server";
import { remult } from "remult";

const PRAGUE_CITY_CODE = 554782;

// SMD of the active Prague elementary school ordinance (the same one as on the
// public data page), synced weekly by the Prague website. Not linked from the
// data page on purpose - it's only useful for them.
export async function GET() {
  const ordinanceId = await api.withRemult(async () => {
    const city = await remult.repo(City).findId(PRAGUE_CITY_CODE);
    if (!city) {
      return null;
    }
    const ordinance = await remult.repo(Ordinance).findFirst({
      city,
      isActive: true,
      schoolType: getSchoolTypeCode("elementary"),
    });
    return ordinance?.id ?? null;
  });

  if (ordinanceId === null) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  return getSmdTextResponse(ordinanceId, {
    "x-robots-tag": "noindex, nofollow",
    "cache-control": "no-store",
  });
}
