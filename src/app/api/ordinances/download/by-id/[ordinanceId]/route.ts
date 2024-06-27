import { NextRequest } from "next/server";
import { downloadOrdinance } from "../../download";

export async function GET(
  req: NextRequest,
  { params }: { params: { ordinanceId: string } }
) {
  return downloadOrdinance(Number(params.ordinanceId));
}
