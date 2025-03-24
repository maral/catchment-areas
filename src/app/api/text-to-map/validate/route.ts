import { SchoolType } from "@/entities/School";
import { getNotLoggedInResponse, isLoggedIn } from "@/utils/server/auth";
import { validateStreetMarkdown } from "@/utils/server/textToMap";
import { texts } from "@/utils/shared/texts";
import { NextRequest, NextResponse } from "next/server";
import { getSchoolTypeCode } from "@/entities/School";

export async function POST(request: NextRequest) {
  if (!(await isLoggedIn())) {
    return getNotLoggedInResponse();
  }

  const { lines, founderId, schoolType } = await request.json();

  const schoolTypeCode = getSchoolTypeCode(schoolType);

  const result = await validateStreetMarkdown(lines, founderId, schoolTypeCode);

  if (result === null) {
    return NextResponse.json(
      { success: false, message: texts.founderNotFound },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, ...result }, { status: 200 });
}
