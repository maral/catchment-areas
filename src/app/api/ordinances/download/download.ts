import { fileTypeFromFile } from "file-type";
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { remult } from "remult";
import { Ordinance } from "../../../../entities/Ordinance";
import { getFilePath } from "../../../../utils/server/textExtraction";
import { api } from "../../[...remult]/api";

export async function downloadOrdinance(ordinanceId: number) {
  const ordinance = await api.withRemult(async () => {
    return await remult.repo(Ordinance).findId(ordinanceId);
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
