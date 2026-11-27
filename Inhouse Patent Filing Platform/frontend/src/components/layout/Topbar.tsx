import { LogOut, Menu } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { BrandMark } from "./BrandMark";

interface Props {
  homePath: string;
  subtitle?: string;
  menuOpen: boolean;
  onMenu: () => void;
  /** Optional search control shown in the middle of the bar. */
  search?: ReactNode;
}

export function Topbar({ homePath, subtitle, menuOpen, onMenu, search }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    // Replace so "Back" after signing out does not step into the protected page we just left.
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation menu"
          aria-controls="app-sidebar"
          aria-expanded={menuOpen}
          className="btn-ghost !p-2 lg:hidden"
        >
          <Menu size={22} aria-hidden="true" />
        </button>

        <BrandMark to={homePath} subtitle={subtitle} />

        <div className="mx-auto hidden min-w-0 flex-1 justify-center px-4 lg:flex">{search}</div>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <div className="hidden text-right sm:block">
            <p className="max-w-[12rem] truncate text-sm font-semibold text-slate-900">
              {user?.name || "User"}
            </p>
            <p className="text-xs font-medium capitalize text-slate-500">
              {(user?.role || "").toLowerCase()}
            </p>
          </div>
          <button type="button" onClick={signOut} className="btn-secondary !px-3 !py-2" aria-label="Sign out">
            <LogOut size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
