import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../[...remult]/api";
import { remult } from "remult";
import { Ordinance } from "../../../../../entities/Ordinance";
import slugify from "slugify";

export async function GET(
  req: NextRequest,
  { params }: { params: { ordinanceId: string } }
) {
  const ordinance = await api.withRemult(async () => {
    return await remult.repo(Ordinance).findId(Number(params.ordinanceId));
  });

  if (!ordinance || !ordinance.jsonData) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const json = JSON.stringify(ordinance.jsonData);

  return new Response(json, {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="adresni-mista-${slugify(
        ordinance.founder.shortName
      ).toLowerCase()}.json"`,
    },
  });
}
