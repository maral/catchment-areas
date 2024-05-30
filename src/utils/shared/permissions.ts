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
  { role: Role.User, label: texts.expert, includes: [], redirect: "/" },
  {
    role: Role.Editor,
    label: texts.editor,
    includes: [Role.User],
    redirect: "/founders",
  },
  {
    role: Role.Admin,
    label: texts.admin,
    includes: [Role.User, Role.Editor],
    redirect: "/founders",
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
  return routes.filter((route) => path.match(route.matcher));
}

export function isAllowedRoute(path: string, role: Role) {
  return getMatchingRoutes(path).every((route) =>
    satisfiesRole(role, route.role)
  );
}

export function getRedirectForRoute(path: string) {
  const matchingRoutes = getMatchingRoutes(path);
  if (matchingRoutes.length === 0) return "/";
  return roles.find((r) => r.role === matchingRoutes[0].role)?.redirect || "/";
}

type Route = {
  matcher: RegExp;
  role: Role;
};

export const routes: Route[] = [
  {
    matcher: pathToRegexp("/users(.*)"),
    role: Role.Admin,
  },
  {
    matcher: pathToRegexp("/regions(.*)"),
    role: Role.Editor,
  },
  {
    matcher: pathToRegexp("/counties(.*)"),
    role: Role.Editor,
  },
  {
    matcher: pathToRegexp("/orps(.*)"),
    role: Role.Editor,
  },
  {
    matcher: pathToRegexp("/founders(.*)"),
    role: Role.User,
  },
];
