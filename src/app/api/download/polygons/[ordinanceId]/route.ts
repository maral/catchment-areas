import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../[...remult]/api";
import { remult } from "remult";
import { Ordinance } from "../../../../../entities/Ordinance";
import { featureCollection } from "@turf/helpers";
import slugify from "slugify";
import { MapData } from "../../../../../entities/MapData";

export async function GET(
  req: NextRequest,
  { params }: { params: { ordinanceId: string } }
) {
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

  if (!mapData.polygons) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const geojson = JSON.stringify(
    mapData.polygons.reduce((acc, featureCollection) => {
      acc.features.push(...featureCollection.features);
      return acc;
    }, featureCollection([]))
  );

  return new Response(geojson, {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="polygony-${slugify(
        cityName
      ).toLowerCase()}.geojson"`,
    },
  });
}
