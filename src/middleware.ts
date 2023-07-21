import { routes } from "./utils/shared/constants";

export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    routes.founders,
    routes.regions,
    routes.counties,
    routes.orps,
    routes.users,
  ],
};
