import { getNotLoggedInResponse, isLoggedIn } from "@/utils/server/auth";
import { insertOrdinanceAndGetResponse } from "@/utils/server/ordinance";
import { uploadAndExtractText } from "@/utils/server/textExtraction";
import { NextRequest, NextResponse } from "next/server";
import { api } from "../../[...remult]/api";
import { syncNewOrdinances } from "@/utils/server/ordinanceMetadataSync";

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
  const schoolType = Number(data.get("schoolType"));
  const redirectRootUrl = data.get("redirectRootUrl") as string;

  if (!file) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const result = await uploadAndExtractText(file);

  const response = await insertOrdinanceAndGetResponse(
    cityCode,
    new Date(validFrom),
    validTo.length > 0 ? new Date(validTo) : undefined,
    serialNumber,
    result,
    schoolType,
    redirectRootUrl
  );

  await api.withRemult(async () => {
    await syncNewOrdinances(schoolType);
  });

  return NextResponse.json(response);
}
