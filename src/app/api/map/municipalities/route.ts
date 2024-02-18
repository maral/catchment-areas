import {
  getOrCreateDataForMapByCityCodes
} from "@/utils/server/textToMap";
import { texts } from "@/utils/shared/texts";
import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  cityCodes: number[];
}

export async function POST(request: NextRequest) {
  const { cityCodes }: RequestBody = await request.json();
  const data = await getOrCreateDataForMapByCityCodes(cityCodes);

  if (data === null) {
    return NextResponse.json(
      { success: false, message: texts.founderNotFound },
      { status: 400 }
    );
  }

  // TODO when polygons are implemented, remove this conversion
  const municipalitiesByCityCodes = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value.]))

  return NextResponse.json({ success: true, municipalitiesByCityCodes }, { status: 200 });
}
