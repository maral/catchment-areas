import {
  Role,
  getRedirectForRoute,
  isAllowedRoute,
} from "@/utils/shared/permissions";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";
import { routes } from "./utils/shared/constants";

const { auth } = NextAuth(authConfig);
export default auth(async function middleware(req) {
  const pathname = req.nextUrl.pathname;
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
  matcher: ["/admin/elementary(.*)", "/admin/kindergarten(.*)", "/admin/users(.*)"],
};
