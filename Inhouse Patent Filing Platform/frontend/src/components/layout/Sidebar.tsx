import { X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { ExternalAnchor } from "./ExternalAnchor";
import type { NavItem } from "./navConfig";

interface Props {
  heading: string;
  items: NavItem[];
  open: boolean;
  onClose: () => void;
}

/**
 * Left navigation. Every item is a real link (`<a href>`), so it supports
 * open-in-new-tab, bookmarking and the browser history. It is a permanent
 * column on large screens and a slide-in drawer on tablets/phones.
 */
export function Sidebar({ heading, items, open, onClose }: Props) {
  const { pathname } = useLocation();

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-charcoal/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="app-sidebar"
        aria-label={heading}
        className={[
          "fixed inset-y-0 left-0 z-50 w-72 transform border-r border-line bg-white transition-transform duration-200",
          "lg:static lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full max-lg:invisible",
        ].join(" ")}
      >
        <div className="flex h-full flex-col lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)]">
          <div className="flex h-[72px] items-center justify-between border-b border-line px-5 lg:hidden">
            <span className="font-display font-semibold text-brand">{heading}</span>
            <button type="button" onClick={onClose} aria-label="Close navigation menu" className="btn-ghost !p-2">
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <p className="eyebrow hidden px-6 pb-2 pt-6 lg:block">{heading}</p>

          <nav aria-label={heading} className="flex-1 space-y-1 overflow-y-auto px-3 py-4 lg:pt-1">
            {items.map(({ to, label, icon: Icon, isActive }) => {
              const active = isActive(pathname);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "bg-brand text-white shadow-sm"
                      : "text-slate-700 hover:bg-brand-50 hover:text-brand",
                  ].join(" ")}
                >
                  <Icon size={18} aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-line p-4 text-xs text-slate-500">
            <ExternalAnchor
              href="https://www.srms.ac.in/"
              className="font-semibold text-slate-600 hover:text-brand"
              showIcon
            >
              Visit srms.ac.in
            </ExternalAnchor>
          </div>
        </div>
      </aside>
    </>
  );
}
