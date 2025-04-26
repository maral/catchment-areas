import { NextRequest } from "next/server";
import { downloadOrdinance } from "../../download";

export async function GET(req: NextRequest, props: { params: Promise<{ ordinanceId: string }> }) {
  const params = await props.params;
  return downloadOrdinance(Number(params.ordinanceId));
}
