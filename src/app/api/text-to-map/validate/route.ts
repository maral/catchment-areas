import { getNotLoggedInResponse, isLoggedIn } from "@/utils/server/auth";
import { validateStreetMarkdown } from "@/utils/server/textToMap";
import { texts } from "@/utils/shared/texts";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!(await isLoggedIn())) {
    return getNotLoggedInResponse();
  }

  const { lines, founderId, schoolType } = await request.json();

  const result = await validateStreetMarkdown(lines, founderId, schoolType);

  if (result === null) {
    return NextResponse.json(
      { success: false, message: texts.founderNotFound },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, ...result }, { status: 200 });
}
