import {
  Activity,
  ClipboardCheck,
  FilePlus2,
  FileText,
  FolderOpen,
  LayoutDashboard,
  type LucideIcon,
  UserRound,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Decides the highlighted ("current page") item for any URL. */
  isActive: (pathname: string) => boolean;
}

/** Applicant / Faculty navigation – one entry per major feature route. */
export const applicantNav: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    isActive: (p) => p === "/dashboard",
  },
  {
    to: "/patents",
    label: "My Patents",
    icon: FileText,
    // list, details and edit – but not the "new draft" page
    isActive: (p) => p === "/patents" || (p.startsWith("/patents/") && !p.startsWith("/patents/new")),
  },
  {
    to: "/patents/new",
    label: "New Patent Draft",
    icon: FilePlus2,
    isActive: (p) => p.startsWith("/patents/new"),
  },
  {
    to: "/documents",
    label: "Documents",
    icon: FolderOpen,
    isActive: (p) => p.startsWith("/documents"),
  },
  {
    to: "/tracking",
    label: "Tracking",
    icon: Activity,
    isActive: (p) => p.startsWith("/tracking"),
  },
  {
    to: "/profile",
    label: "Profile",
    icon: UserRound,
    isActive: (p) => p.startsWith("/profile"),
  },
];

/** Administrator navigation. */
export const adminNav: NavItem[] = [
  {
    to: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    isActive: (p) => p === "/admin",
  },
  {
    to: "/admin/patents",
    label: "Applications",
    icon: FileText,
    isActive: (p) => p.startsWith("/admin/patents"),
  },
  {
    to: "/admin/documents",
    label: "Document Review",
    icon: ClipboardCheck,
    isActive: (p) => p.startsWith("/admin/documents"),
  },
];
