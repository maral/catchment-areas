import { api } from "@/app/api/[...remult]/api";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { SchoolType } from "@/entities/School";
import { getNotLoggedInResponse, isLoggedIn } from "@/utils/server/auth";
import { insertOrdinanceAndGetResponse } from "@/utils/server/ordinance";
import { syncNewOrdinances } from "@/utils/server/ordinanceMetadataSync";
import { downloadAndExtractText } from "@/utils/server/textExtraction";
import { getOrdinanceDocumentDownloadLink } from "@/utils/shared/ordinanceMetadata";
import { NextRequest, NextResponse } from "next/server";
import { remult } from "remult";

export async function POST(request: NextRequest) {
  if (!(await isLoggedIn())) {
    return getNotLoggedInResponse();
  }

  const { cityCode, ordinanceMetadataId, schoolType, redirectRootUrl } =
    await request.json();

  const documentUrl = getOrdinanceDocumentDownloadLink(ordinanceMetadataId);

  const result = await downloadAndExtractText(documentUrl);

  const ordinanceMetadata = await api.withRemult(async () => {
    return await remult.repo(OrdinanceMetadata).findId(ordinanceMetadataId);
  });

  const response = await insertOrdinanceAndGetResponse(
    cityCode,
    ordinanceMetadata.validFrom,
    ordinanceMetadata.validTo,
    ordinanceMetadata.number,
    result,
    schoolType,
    redirectRootUrl
  );

  await api.withRemult(async () => {
    await syncNewOrdinances(SchoolType.Elementary);
  });

  return NextResponse.json(response);
}
