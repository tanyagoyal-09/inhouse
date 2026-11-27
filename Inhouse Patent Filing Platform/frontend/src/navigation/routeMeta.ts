/**
 * Breadcrumb + document-title metadata for every route in the app.
 * Keeping this in one place means the shell, breadcrumbs and browser tab
 * title cannot drift apart from the router configuration in App.tsx.
 */

export interface Crumb {
  label: string;
  /** Omitted for the current page. */
  to?: string;
}

const APPLICANT_ROOT: Crumb = { label: "Dashboard", to: "/dashboard" };
const ADMIN_ROOT: Crumb = { label: "Administration", to: "/admin" };

function normalise(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

export function getCrumbs(pathname: string): Crumb[] {
  const seg = normalise(pathname).split("/").filter(Boolean);

  /* ---------------- Administration ---------------- */
  if (seg[0] === "admin") {
    if (seg.length === 1) return [{ label: "Administration" }];

    if (seg[1] === "patents") {
      if (seg.length === 2) return [ADMIN_ROOT, { label: "Applications" }];
      return [
        ADMIN_ROOT,
        { label: "Applications", to: "/admin/patents" },
        { label: "Application Review" },
      ];
    }

    if (seg[1] === "documents") {
      return [ADMIN_ROOT, { label: "Document Review" }];
    }

    return [ADMIN_ROOT, { label: "Page not found" }];
  }

  /* ---------------- Applicant / Faculty ---------------- */
  switch (seg[0]) {
    case "dashboard":
      return [{ label: "Dashboard" }];

    case "patents": {
      const list: Crumb = { label: "My Patents", to: "/patents" };
      if (seg.length === 1) return [APPLICANT_ROOT, { label: "My Patents" }];
      if (seg[1] === "new" && seg.length === 2) {
        return [APPLICANT_ROOT, list, { label: "New Patent Draft" }];
      }
      if (seg.length === 2) {
        return [APPLICANT_ROOT, list, { label: "Patent Details" }];
      }
      if (seg[2] === "edit" && seg.length === 3) {
        return [
          APPLICANT_ROOT,
          list,
          { label: "Patent Details", to: `/patents/${seg[1]}` },
          { label: "Edit Application" },
        ];
      }
      break;
    }

    case "documents":
      return [APPLICANT_ROOT, { label: "Documents" }];

    case "tracking":
      return [APPLICANT_ROOT, { label: "Tracking" }];

    case "profile":
      return [APPLICANT_ROOT, { label: "Profile" }];
  }

  return [{ label: "Page not found" }];
}

export function getPageTitle(pathname: string): string {
  const crumbs = getCrumbs(pathname);
  return crumbs[crumbs.length - 1]?.label ?? "Inhouse Patent Filing System";
}
