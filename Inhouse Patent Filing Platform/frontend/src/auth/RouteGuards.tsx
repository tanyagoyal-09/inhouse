import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./AuthContext";
import { homePathFor, isReturnPathAllowed } from "./paths";
import type { Role } from "../types";

interface RequireRoleProps {
  roles: Role[];
  /** Where to send signed-out visitors. */
  loginPath: string;
}

/**
 * Protects a group of routes.
 *  - signed out  → sign-in page, remembering where the visitor was heading
 *  - wrong role  → that role's own home (e.g. an applicant opening /admin)
 *
 * Both redirects use `replace` so the blocked URL never becomes a history
 * entry that Back would bounce off.
 */
export function RequireRole({ roles, loginPath }: RequireRoleProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }

  return <Outlet />;
}

/**
 * Sign-in / register pages. A signed-in visitor is moved on (with `replace`)
 * to the page they originally asked for, or their role's home.
 * Doing this here – rather than in each login form – means exactly one
 * navigation happens after a successful login.
 */
export function PublicOnly() {
  const { user } = useAuth();
  const location = useLocation();

  if (user) {
    const from = (location.state as { from?: unknown } | null)?.from;
    const target = isReturnPathAllowed(from, user.role)
      ? from
      : homePathFor(user.role);
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
