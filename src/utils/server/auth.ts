import { getServerSessionWithOptions } from "@/app/api/auth/[...nextauth]/config";
import { NextResponse } from "next/server";

export async function isLoggedIn(): Promise<boolean> {
  return !!await getServerSessionWithOptions();
}

export function getNotLoggedInResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "You must be signed in.",
    },
    { status: 401 }
  );
}
