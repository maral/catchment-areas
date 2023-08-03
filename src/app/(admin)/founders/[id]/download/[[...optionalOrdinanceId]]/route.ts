import { api } from "@/app/api/[...remult]/api";
import { Founder } from "@/entities/Founder";
import {
  getOrCreateMunicipalitiesByFounderId,
  getOrCreateMunicipalities,
} from "@/utils/server/textToMap";
import { NextRequest, NextResponse } from "next/server";
import { remult } from "remult";
import slugify from "slugify";

export async function GET(
  req: NextRequest,
  {
    params: { id, optionalOrdinanceId },
  }: { params: { id: string; optionalOrdinanceId: string[] } }
) {
  const founder = await api.withRemult(async () =>
    remult.repo(Founder).findId(Number(id))
  );

  const municipalities = await getOrCreateMunicipalities(
    founder,
    optionalOrdinanceId.length > 0 ? Number(optionalOrdinanceId[0]) : undefined
  );

  if (municipalities === null) {
    return NextResponse.json(
      {
        success: false,
        message: "Could not get JSON, resources not found",
      },
      { status: 404 }
    );
  }

  const fileName = slugify(founder.shortName).toLowerCase() + ".json";

  return new Response(JSON.stringify(municipalities), {
    headers: {
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Type": "application/json",
    },
  });
}
