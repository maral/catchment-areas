import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../[...remult]/api";
import { remult } from "remult";
import { Ordinance } from "@/entities/Ordinance";
import { featureCollection } from "@turf/helpers";
import slugify from "slugify";
import { MapData } from "@/entities/MapData";

const allowedFormats = ["geojson", "json"];

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ ordinanceId: string }> }
) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "geojson";
  const params = await props.params;

  const result = await getPolygons(Number(params.ordinanceId));
  if (result === null || !allowedFormats.includes(format)) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const { cityName, polygons } = result;
  return new Response(
    JSON.stringify(
      format === "geojson"
        ? polygons.reduce((acc, featureCollection) => {
            acc.features.push(...featureCollection.features);
            return acc;
          }, featureCollection([]))
        : polygons
    ),
    {
      headers: {
        "content-type": "application/json",
        "content-disposition": `attachment; filename="polygony-${slugify(
          cityName
        ).toLowerCase()}.${format}"`,
      },
    }
  );
}

async function getPolygons(ordinanceId: number) {
  const result = await api.withRemult(async () => {
    const ordinance = await remult.repo(Ordinance).findId(ordinanceId);
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
    return null;
  }

  const { mapData, cityName } = result;

  if (!mapData.polygons) {
    return null;
  }

  return { polygons: mapData.polygons, cityName };
}
