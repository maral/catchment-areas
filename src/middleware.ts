import {
  Role,
  getRedirectForRoute,
  isAllowedRoute,
} from "@/utils/shared/permissions";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";
import NextAuth from "next-auth";
import { routes } from "./utils/shared/constants";

const { auth } = NextAuth(authConfig);
export default auth(async function middleware(req) {
  const pathname = req.nextUrl.pathname;
  if (pathname.includes("_next/static")) {
    console.log("Static file request", pathname);
    const rewrittenPath = pathname.replace(/@/g, "%40");
    if (rewrittenPath !== pathname) {
      console.log("Rewritten to", pathname);

      return NextResponse.rewrite(rewrittenPath);
    }
  }

  const role = req.auth?.user.role as Role;

  if (!req.auth) {
    return NextResponse.redirect(new URL(routes.signIn, req.url));
  }

  if (!isAllowedRoute(pathname, role)) {
    return NextResponse.redirect(
      new URL(getRedirectForRoute(pathname), req.url)
    );
  }
});

export const config = {
  matcher: ["/elementary(.*)", "/kindergarten(.*)", "/users(.*)", "/(.*)"],
};
