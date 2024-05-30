import {
  Role,
  getRedirectForRoute,
  isAllowedRoute
} from "@/utils/shared/permissions";
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(async function middleware(req, res) {
  const role = req.nextauth.token?.role as Role;
  const pathname = req.nextUrl.pathname;

  if (!isAllowedRoute(pathname, role)) {
    return NextResponse.redirect(
      new URL(getRedirectForRoute(pathname), req.url)
    );
  }
});

export const config = {
  matcher: [
    "/founders(.*)",
    "/regions(.*)",
    "/counties(.*)",
    "/orps(.*)",
    "/users(.*)",
  ],
};
