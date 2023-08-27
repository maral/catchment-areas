import { getNotLoggedInResponse, isLoggedIn } from "@/utils/server/auth";
import {
  getOrCreateMunicipalitiesByCityCodes
} from "@/utils/server/textToMap";
import { texts } from "@/utils/shared/texts";
import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  cityCodes: number[];
}

export async function POST(request: NextRequest) {
  if (!(await isLoggedIn())) {
    return getNotLoggedInResponse();
  }

  const { cityCodes }: RequestBody = await request.json();
  const municipalitiesByCityCodes = await getOrCreateMunicipalitiesByCityCodes(cityCodes);

  if (municipalitiesByCityCodes === null) {
    return NextResponse.json(
      { success: false, message: texts.founderNotFound },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, municipalitiesByCityCodes }, { status: 200 });
}
