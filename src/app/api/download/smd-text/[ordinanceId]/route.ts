import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../[...remult]/api";
import { remult } from "remult";
import { Ordinance } from "@/entities/Ordinance";
import slugify from "slugify";
import { StreetMarkdownControllerServer } from "@/controllers/StreetMarkdownControllerServer";
import { getSmdText } from "@/utils/server/textToMap";

export async function GET(
  req: NextRequest,
  { params }: { params: { ordinanceId: string } }
) {
  const { text, ordinance } = await api.withRemult(async () => {
    const ordinance = await remult
      .repo(Ordinance)
      .findId(Number(params.ordinanceId));

    if (!ordinance) {
      return { text: null, ordinance: null };
    }

    return {
      text: getSmdText(
        await StreetMarkdownControllerServer.getStreetMarkdownTexts(
          ordinance.city.code,
          ordinance.id
        )
      ),
      ordinance,
    };
  });

  if (!text) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  return new Response(text, {
    headers: {
      "content-type": "text/plain",
      "content-disposition": `attachment; filename="vyhlaska-${slugify(
        ordinance.city.name
      ).toLowerCase()}.txt"`,
    },
  });
}
