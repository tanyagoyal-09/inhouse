import type { Role } from "../types";

/** Landing route for each role after signing in. */
export function homePathFor(role: Role): string {
  return role === "ADMIN" ? "/admin" : "/dashboard";
}

const PUBLIC_PATHS = ["/", "/login", "/register", "/admin/login"];

/**
 * Decide whether `path` is a sensible place to return a signed-in user of
 * `role` to (e.g. after a bookmark/deep link forced them through sign-in).
 * Guards against open redirects and against sending an applicant into the
 * admin area (or vice versa).
 */
export function isReturnPathAllowed(path: unknown, role: Role): path is string {
  if (typeof path !== "string") return false;
  if (!path.startsWith("/") || path.startsWith("//")) return false;

  const pathname = path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (PUBLIC_PATHS.includes(pathname)) return false;

  const inAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  return role === "ADMIN" ? inAdminArea : !inAdminArea;
}
