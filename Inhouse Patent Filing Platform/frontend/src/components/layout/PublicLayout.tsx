import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { homePathFor } from "../../auth/paths";
import { BrandMark } from "./BrandMark";
import { SiteFooter } from "./SiteFooter";
import { UtilityBar } from "./UtilityBar";

function titleFor(pathname: string): string {
  switch (pathname.replace(/\/+$/, "") || "/") {
    case "/":
      return "Inhouse Patent Filing System | SRMS College of Engineering & Technology";
    case "/login":
      return "Sign in | Inhouse Patent Filing System";
    case "/register":
      return "Create account | Inhouse Patent Filing System";
    case "/admin/login":
      return "Administrator sign in | Inhouse Patent Filing System";
    default:
      return "Page not found | Inhouse Patent Filing System";
  }
}

/** Header + footer for pages visitors can see without signing in. */
export function PublicLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = titleFor(pathname);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <UtilityBar />

      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <BrandMark to="/" />

          <nav aria-label="Primary" className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link to={homePathFor(user.role)} className="btn-primary">
                Open workspace
              </Link>
            ) : (
              <>
                <Link to="/admin/login" className="btn-ghost hidden sm:inline-flex">
                  Administrator
                </Link>
                <Link to="/login" className="btn-primary">
                  Sign in
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}
