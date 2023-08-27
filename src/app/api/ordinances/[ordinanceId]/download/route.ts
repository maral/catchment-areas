import { Ordinance } from "@/entities/Ordinance";
import { getFilePath } from "@/utils/server/textExtraction";
import { fileTypeFromFile } from "file-type";
import { readFileSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
import { remult } from "remult";
import { api } from "../../../[...remult]/api";
import { getNotLoggedInResponse, isLoggedIn } from "@/utils/server/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { ordinanceId: string } }
) {
  if (!(await isLoggedIn())) {
    return getNotLoggedInResponse();
  }

  const ordinance = await api.withRemult(async () => {
    return await remult.repo(Ordinance).findId(Number(params.ordinanceId));
  });

  const filePath = getFilePath(ordinance.fileName);
  const type = await fileTypeFromFile(filePath);

  try {
    const data = readFileSync(filePath);

    return new Response(data, {
      headers: {
        "content-type": type?.mime ?? "application/octet-stream",
        "content-disposition": `attachment; filename="${ordinance.fileName}"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
