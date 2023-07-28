import { routes } from "./utils/shared/constants";

export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    '/founders',
    '/regions',
    '/counties',
    '/orps',
    '/users',
  ],
};
