import { api } from "@/app/api/[...remult]/api";
import { StreetMarkdownControllerServer } from "@/controllers/StreetMarkdownControllerServer";
import { Ordinance } from "@/entities/Ordinance";
import { getSmdText } from "@/utils/server/textToMap";
import { NextResponse } from "next/server";
import { remult } from "remult";
import slugify from "slugify";

// Street markdown of all founders of the ordinance as a text file.
export async function getSmdTextResponse(
  ordinanceId: number,
  headers: Record<string, string> = {}
): Promise<Response> {
  const { text, ordinance } = await api.withRemult(async () => {
    const ordinance = await remult.repo(Ordinance).findId(ordinanceId);

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
      ...headers,
    },
  });
}
