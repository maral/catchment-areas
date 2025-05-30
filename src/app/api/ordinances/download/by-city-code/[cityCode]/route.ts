import { api } from "@/app/api/[...remult]/api";
import { City } from "@/entities/City";
import { Founder } from "@/entities/Founder";
import { Ordinance } from "@/entities/Ordinance";
import { NextRequest, NextResponse } from "next/server";
import { remult } from "remult";
import { downloadOrdinance } from "../../download";

export async function GET(req: NextRequest, props: { params: Promise<{ cityCode: string }> }) {
  const params = await props.params;
  const ordinanceId = await api.withRemult(async () => {
    const city = await remult.repo(City).findId(params.cityCode);
    if (!city) {
      return null;
    }

    const ordinance = await remult
      .repo(Ordinance)
      .findFirst({ city, isActive: true });
    return ordinance?.id ?? null;
  });

  if (ordinanceId === null) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  return downloadOrdinance(ordinanceId);
}
