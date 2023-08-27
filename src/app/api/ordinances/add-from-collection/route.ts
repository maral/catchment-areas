import { api } from "@/app/api/[...remult]/api";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { isLoggedIn, getNotLoggedInResponse } from "@/utils/server/auth";
import { insertOrdinanceAndGetResponse } from "@/utils/server/ordinance";
import { downloadAndExtractText } from "@/utils/server/textExtraction";
import { getOrdinanceDocumentDownloadLink } from "@/utils/shared/ordinanceMetadata";
import { NextRequest, NextResponse } from "next/server";
import { remult } from "remult";

export async function POST(request: NextRequest) {
  if (!(await isLoggedIn())) {
    return getNotLoggedInResponse();
  }

  const { founderId, ordinanceMetadataId } = await request.json();

  const documentUrl = getOrdinanceDocumentDownloadLink(ordinanceMetadataId);

  const result = await downloadAndExtractText(documentUrl);

  const ordinanceMetadata = await api.withRemult(async () => {
    return await remult.repo(OrdinanceMetadata).findId(ordinanceMetadataId);
  });

  return NextResponse.json(
    await insertOrdinanceAndGetResponse(
      founderId,
      ordinanceMetadata.validFrom,
      ordinanceMetadata.validTo,
      ordinanceMetadata.number,
      result
    )
  );
}
