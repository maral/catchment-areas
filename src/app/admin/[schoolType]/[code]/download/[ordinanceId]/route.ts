import { api } from "@/app/api/[...remult]/api";
import { City } from "@/entities/City";
import { getSchoolTypeCode } from "@/entities/School";
import { getOrCreateDataForMapByCityCode } from "@/utils/server/textToMap";
import { NextRequest, NextResponse } from "next/server";
import { remult } from "remult";
import slugify from "slugify";

export async function GET(
  req: NextRequest,
  props: {
    params: Promise<{
      code: string;
      ordinanceId: string;
      schoolType: string;
    }>;
  }
) {
  const params = await props.params;

  const { code, ordinanceId, schoolType } = params;

  const { city, municipalities } = await api.withRemult(async () => {
    const city = await remult.repo(City).findId(Number(code));

    const municipalities = await getOrCreateDataForMapByCityCode(
      Number(code),
      Number(ordinanceId),
      getSchoolTypeCode(schoolType)
    );

    return { city, municipalities };
  });

  if (municipalities === null) {
    return NextResponse.json(
      {
        success: false,
        message: "Could not get JSON, resources not found",
      },
      { status: 404 }
    );
  }

  const fileName = slugify(city.name).toLowerCase() + ".json";

  return new Response(JSON.stringify(municipalities), {
    headers: {
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": "application/json",
    },
  });
}
