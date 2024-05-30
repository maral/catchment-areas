import { getServerSessionWithOptions } from "@/app/api/auth/[...nextauth]/config";
import { NextResponse } from "next/server";
import { Role } from "@/utils/shared/permissions";

export async function isLoggedIn(): Promise<boolean> {
  return !!(await getServerSessionWithOptions());
}

async function isLoggedWithRole(role: Role): Promise<boolean> {
  return (await getServerSessionWithOptions())?.user.role === role;
}

export async function isLoggedAsAdmin(): Promise<boolean> {
  return await isLoggedWithRole(Role.Admin);
}

export function getNotLoggedInResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "You must be signed in.",
    },
    { status: 401 }
  );
}
