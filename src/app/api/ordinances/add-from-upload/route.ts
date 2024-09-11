import { getNotLoggedInResponse, isLoggedIn } from "@/utils/server/auth";
import { insertOrdinanceAndGetResponse } from "@/utils/server/ordinance";
import { uploadAndExtractText } from "@/utils/server/textExtraction";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!(await isLoggedIn())) {
    return getNotLoggedInResponse();
  }

  const data = await req.formData();
  const file: File | null = data.get("file") as unknown as File;
  const validFrom = data.get("validFrom") as string;
  const validTo = data.get("validTo") as string;
  const serialNumber = data.get("serialNumber") as string;
  const cityCode = Number(data.get("cityCode"));

  if (!file) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const result = await uploadAndExtractText(file);

  return NextResponse.json(
    await insertOrdinanceAndGetResponse(
      cityCode,
      new Date(validFrom),
      validTo.length > 0 ? new Date(validTo) : undefined,
      serialNumber,
      result
    )
  );
}
