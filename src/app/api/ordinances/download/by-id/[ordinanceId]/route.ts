import { getNotLoggedInResponse, isLoggedIn } from "@/utils/server/auth";
import { NextRequest } from "next/server";
import { downloadOrdinance } from "../../download";

export async function GET(
  req: NextRequest,
  { params }: { params: { ordinanceId: string } }
) {
  if (!(await isLoggedIn())) {
    return getNotLoggedInResponse();
  }

  return downloadOrdinance(Number(params.ordinanceId));
}
