import { validateStreetMarkdown } from "@/utils/server/textToMap";
import { texts } from "@/utils/shared/texts";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { lines, founderId } = await request.json();
  const result = await validateStreetMarkdown(lines, founderId);

  if (result === null) {
    return NextResponse.json(
      { success: false, message: texts.founderNotFound },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, ...result }, { status: 200 });
}
