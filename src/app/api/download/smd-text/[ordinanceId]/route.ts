import { getNotLoggedInResponse, isLoggedIn } from "@/utils/server/auth";
import { getSmdTextResponse } from "@/utils/server/smdDownload";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, props: { params: Promise<{ ordinanceId: string }> }) {
  if (!(await isLoggedIn())) {
    return getNotLoggedInResponse();
  }

  const params = await props.params;
  return getSmdTextResponse(Number(params.ordinanceId));
}
