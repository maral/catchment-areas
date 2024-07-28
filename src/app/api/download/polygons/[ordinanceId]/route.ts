import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../[...remult]/api";
import { remult } from "remult";
import { Ordinance } from "../../../../../entities/Ordinance";
import { featureCollection } from "@turf/helpers";
import slugify from "slugify";

export async function GET(
  req: NextRequest,
  { params }: { params: { ordinanceId: string } }
) {
  const ordinance = await api.withRemult(async () => {
    return await remult.repo(Ordinance).findId(Number(params.ordinanceId));
  });

  if (!ordinance || !ordinance.polygons) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const geojson = JSON.stringify(
    ordinance.polygons.reduce((acc, featureCollection) => {
      acc.features.push(...featureCollection.features);
      return acc;
    }, featureCollection([]))
  );

  return new Response(geojson, {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="polygony-${slugify(
        ordinance.founder.shortName
      ).toLowerCase()}.geojson"`,
    },
  });
}
