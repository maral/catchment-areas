import {
  Role,
  getRedirectForRoute,
  isAllowedRoute,
} from "@/utils/shared/permissions";
import { NextRequest, NextResponse } from "next/server";
import authConfig from "./auth.config";
import NextAuth from "next-auth";
import { routes } from "./utils/shared/constants";

// const { auth } = NextAuth(authConfig);
// export default auth(async function middleware(req) {
//   const pathname = req.nextUrl.pathname;
//   const role = req.auth?.user.role as Role;

//   if (!req.auth) {
//     return NextResponse.redirect(new URL(routes.signIn, req.url));
//   }

//   if (!isAllowedRoute(pathname, role)) {
//     return NextResponse.redirect(
//       new URL(getRedirectForRoute(pathname), req.url)
//     );
//   }
// });

// export const config = {
//   matcher: ["/elementary(.*)", "/kindergarten(.*)", "/users(.*)"],
// };

export const config = {
  matcher: "/_next/static/chunks/:path*",
};

export const middleware = (request: NextRequest) => {
  const url = new URL(request.url);

  const decodedPathname = url.pathname
    .split("/")
    .map(decodeURIComponent)
    .join("/");
  const encodedPathname = decodedPathname
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  const includesEncodableChar = url.pathname !== encodedPathname;
  if (!includesEncodableChar) return;

  const hasAlreadyDecoded = url.pathname === decodedPathname;
  if (hasAlreadyDecoded) return;

  const destination = new URL(url);
  destination.pathname = encodedPathname;
  return NextResponse.rewrite(destination);
};
