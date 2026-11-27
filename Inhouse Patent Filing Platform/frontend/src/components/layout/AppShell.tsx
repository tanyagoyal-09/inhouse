import { type ReactNode, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { getPageTitle } from "../../navigation/routeMeta";
import { Breadcrumbs } from "./Breadcrumbs";
import { SiteFooter } from "./SiteFooter";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { UtilityBar } from "./UtilityBar";
import { adminNav, applicantNav } from "./navConfig";

interface Props {
  variant: "applicant" | "admin";
  /** Search control rendered in the header (optional). */
  search?: ReactNode;
}

/**
 * Layout for every signed-in page: utility bar, header, sidebar,
 * breadcrumbs, routed content (<Outlet/>) and footer.
 */
export function AppShell({ variant, search }: Props) {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = variant === "admin";
  const items = isAdmin ? adminNav : applicantNav;

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setMenuOpen(false), [pathname]);

  // Browser tab title follows the page.
  useEffect(() => {
    document.title = `${getPageTitle(pathname)} | Inhouse Patent Filing System – SRMS CET`;
  }, [pathname]);

  // Esc closes the drawer.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <UtilityBar />

      <Topbar
        homePath={isAdmin ? "/admin" : "/dashboard"}
        subtitle={isAdmin ? "Administration Console" : undefined}
        menuOpen={menuOpen}
        onMenu={() => setMenuOpen(true)}
        search={search}
      />

      {search && (
        <div className="sticky top-[72px] z-20 border-b border-line bg-white px-4 py-2.5 sm:px-6 lg:hidden">
          {search}
        </div>
      )}

      <div className="flex flex-1">
        <Sidebar
          heading={isAdmin ? "Administration" : "Workspace"}
          items={items}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <main id="main-content" tabIndex={-1} className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1400px]">
              <Breadcrumbs />
              <Outlet />
            </div>
          </main>

          <SiteFooter compact />
        </div>
      </div>
    </div>
  );
}
