import { routes } from "./constants";
import { texts } from "./texts";
import { pathToRegexp } from "path-to-regexp";

export enum Role {
  User = "user", // regular user, can see hidden layers
  Editor = "editor", // can edit all data
  Admin = "admin", // super admin, on top of everything can manage users
}

type RoleConfig = {
  role: Role;
  label: string;
  includes: Role[];
  redirect: string;
};

export const roles: RoleConfig[] = [
  { role: Role.User, label: texts.expert, includes: [], redirect: routes.home },
  {
    role: Role.Editor,
    label: texts.editor,
    includes: [Role.User],
    redirect: routes.home,
  },
  {
    role: Role.Admin,
    label: texts.admin,
    includes: [Role.User, Role.Editor],
    redirect: routes.home,
  },
];

export function getRoleLabel(role: Role) {
  return roles.find((r) => r.role === role)?.label || "";
}

function getAllCompatibleRoles(role: Role): Role[] {
  const roleConfig = roles.find((r) => r.role === role);
  if (!roleConfig) return [];
  return [role, ...roleConfig.includes];
}

function satisfiesRole(role: Role, requiredRole: Role) {
  return getAllCompatibleRoles(role).includes(requiredRole);
}

function getMatchingRoutes(path: string) {
  return restrictedRoutes.filter((route) =>
    path.match(pathToRegexp(route.path))
  );
}

export function isAllowedRoute(path: string, role: Role) {
  return getMatchingRoutes(path).every((route) =>
    satisfiesRole(role, route.role)
  );
}

export function getRedirectForRoute(path: string) {
  const matchingRoutes = getMatchingRoutes(path);
  if (matchingRoutes.length === 0) return routes.signIn;
  return roles.find((r) => r.role === matchingRoutes[0].role)?.redirect || "/";
}

type Route = {
  path: string;
  role: Role;
};

export const restrictedRoutes: Route[] = [
  {
    path: "/users(.*)",
    role: Role.Admin,
  },
  {
    path: "/elementary(.*)",
    role: Role.Editor,
  },
  {
    path: "/kindergarten(.*)",
    role: Role.Editor,
  },
];
