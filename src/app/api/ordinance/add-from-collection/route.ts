import { Ordinance } from "@/entities/Ordinance";
import { getOrdinanceDocumentDownloadLink } from "@/utils/shared/ordinanceMetadata";
import { extractText } from "@/utils/server/textExtraction";
import { NextRequest, NextResponse } from "next/server";
import { remult } from "remult";
import { api } from "../../[...remult]/route";
import { OrdinanceMetadata } from "@/entities/OrdinanceMetadata";
import { Founder } from "@/entities/Founder";

export async function POST(request: NextRequest) {
  const ordinanceRepo = remult.repo(Ordinance);
  const ordinanceMetadataRepo = remult.repo(OrdinanceMetadata);
  const founderRepo = remult.repo(Founder);

  const { founderId, ordinanceMetadataId } = await request.json();

  const documentUrl = getOrdinanceDocumentDownloadLink(ordinanceMetadataId);

  const result = await extractText(documentUrl);

  if (result.text) {
    const ordinance = await api.withRemult(async () => {
      const ordinanceMetadata = await ordinanceMetadataRepo.findId(
        ordinanceMetadataId
      );
      const isActive = !ordinanceMetadata.validTo || ordinanceMetadata.validTo > new Date();
      const founder = await founderRepo.findId(founderId);
      return ordinanceRepo.insert({
        documentUrl,
        number: ordinanceMetadata.number,
        originalText: result.text ?? undefined,
        validFrom: ordinanceMetadata.validFrom,
        validTo: ordinanceMetadata.validTo,
        isActive,
        ordinanceMetadata,
        founder,
      });
    });

    if (!ordinance) {
      return NextResponse.json({
        success: false,
        fileType: result.fileType,
      });
    }

    return NextResponse.json({
      success: true,
      ordinanceId: ordinance.id,
    });
  }

  return NextResponse.json({
    success: false,
    fileType: result.fileType,
  });
}
