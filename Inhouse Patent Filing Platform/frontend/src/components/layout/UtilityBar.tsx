import { ExternalAnchor } from "./ExternalAnchor";
import { SRMS_QUICK_LINKS } from "./srmsLinks";

/** Slim dark strip above the main header, mirroring the utility bar on srms.ac.in. */
export function UtilityBar() {
  return (
    <div className="on-dark bg-charcoal text-xs text-slate-300">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-1.5 sm:px-6 lg:px-8">
        <p className="truncate font-medium">
          Shri Ram Murti Smarak College of Engineering &amp; Technology, Bareilly
        </p>

        <nav aria-label="SRMS official links" className="hidden items-center gap-5 md:flex">
          {SRMS_QUICK_LINKS.map((link) => (
            <ExternalAnchor
              key={link.href}
              href={link.href}
              className="whitespace-nowrap transition hover:text-white"
            >
              {link.label}
            </ExternalAnchor>
          ))}
        </nav>
      </div>
    </div>
  );
}
