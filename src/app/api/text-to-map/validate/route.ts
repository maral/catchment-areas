import { isLoggedIn, getNotLoggedInResponse } from "@/utils/server/auth";
import { validateStreetMarkdown } from "@/utils/server/textToMap";
import { texts } from "@/utils/shared/texts";
import { NextRequest, NextResponse } from "next/server";
import { api } from "../../[...remult]/api";
import { KnexDataProvider } from "remult/remult-knex";

export async function POST(request: NextRequest) {
  if (!(await isLoggedIn())) {
    return getNotLoggedInResponse();
  }

  // const knexProvider = (await api.getRemult(request))
  //   .dataProvider as KnexDataProvider;
  // const knex = knexProvider.knex;
  // const pool = knex.client.pool;

  // console.log(
  //   `BEFORE: used: ${pool.numUsed()}, free: ${pool.numFree()}, pending: ${pool.numPendingAcquires() + pool.numPendingValidations() + pool.numPendingCreates()}`
  // );

  const { lines, founderId } = await request.json();
  const result = await validateStreetMarkdown(lines, founderId);

  // console.log(
  //   `AFTER: used: ${pool.numUsed()}, free: ${pool.numFree()}, pending: ${pool.numPendingAcquires() + pool.numPendingValidations() + pool.numPendingCreates()}`
  // );

  if (result === null) {
    return NextResponse.json(
      { success: false, message: texts.founderNotFound },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, ...result }, { status: 200 });
}
