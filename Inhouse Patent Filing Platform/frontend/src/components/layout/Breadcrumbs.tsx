import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { Link, useLocation } from "react-router-dom";

import { getCrumbs } from "../../navigation/routeMeta";

/** Breadcrumb trail derived from the current URL (see navigation/routeMeta.ts). */
export function Breadcrumbs() {
  const { pathname } = useLocation();
  const crumbs = getCrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-600">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <li>
                {crumb.to && !isLast ? (
                  <Link to={crumb.to} className="rounded font-medium text-slate-600 hover:text-brand hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? "page" : undefined} className="font-semibold text-slate-900">
                    {crumb.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="text-slate-500">
                  <ChevronRight size={14} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
