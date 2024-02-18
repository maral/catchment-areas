import { getOrCreateDataForMapByCityCodes } from "@/utils/server/textToMap";
import { texts } from "@/utils/shared/texts";
import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  cityCodes: number[];
}

export async function POST(request: NextRequest) {
  const { cityCodes }: RequestBody = await request.json();
  const dataForMapByCityCodes = await getOrCreateDataForMapByCityCodes(
    cityCodes
  );

  if (dataForMapByCityCodes === null) {
    return NextResponse.json(
      { success: false, message: texts.founderNotFound },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { success: true, dataForMapByCityCodes },
    { status: 200 }
  );
}
