import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../[...remult]/api";
import { remult } from "remult";
import { Ordinance } from "../../../../../entities/Ordinance";
import slugify from "slugify";
import { MapData } from "../../../../../entities/MapData";

export async function GET(req: NextRequest, props: { params: Promise<{ ordinanceId: string }> }) {
  const params = await props.params;
  const result = await api.withRemult(async () => {
    const ordinance = await remult
      .repo(Ordinance)
      .findId(Number(params.ordinanceId));
    if (!ordinance) {
      return null;
    }
    return {
      mapData: await remult.repo(MapData).findFirst({
        ordinanceId: ordinance.id,
        cityCode: ordinance.city.code,
      }),
      cityName: ordinance.city.name,
    };
  });

  if (result === null) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const { mapData, cityName } = result;

  if (!mapData.jsonData) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const json = JSON.stringify(mapData.jsonData);

  return new Response(json, {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="adresni-mista-${slugify(
        cityName
      ).toLowerCase()}.json"`,
    },
  });
}
