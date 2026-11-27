import { ExternalAnchor } from "./ExternalAnchor";
import { SRMS_INSTITUTIONS, SRMS_QUICK_LINKS } from "./srmsLinks";

interface Props {
  /** Single-line footer used inside the signed-in application shell. */
  compact?: boolean;
}

export function SiteFooter({ compact = false }: Props) {
  const year = new Date().getFullYear();

  if (compact) {
    return (
      <footer className="on-dark mt-6 bg-charcoal text-xs text-slate-300">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © {year} Shri Ram Murti Smarak Institutions · Inhouse Patent Filing System
          </p>
          <nav aria-label="SRMS links" className="flex flex-wrap gap-x-5 gap-y-1">
            {SRMS_QUICK_LINKS.map((link) => (
              <ExternalAnchor
                key={link.href}
                href={link.href}
                className="transition hover:text-white"
              >
                {link.label}
              </ExternalAnchor>
            ))}
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="on-dark bg-charcoal text-slate-300">
      <div className="h-1 bg-brand" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1.4fr] lg:px-8">
        <section aria-labelledby="footer-about">
          <img
            src="/assets/srmscet-logo.jpeg"
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 rounded-full bg-white object-contain p-0.5"
          />
          <h2 id="footer-about" className="mt-4 font-display text-lg font-semibold text-white">
            Inhouse Patent Filing System
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
            The official in-house patent filing system of Shri Ram Murti Smarak College of
            Engineering &amp; Technology, Bareilly. Draft, document, submit and track patent applications in
            one place.
          </p>
        </section>

        <nav aria-labelledby="footer-links">
          <h2 id="footer-links" className="font-display text-sm font-semibold uppercase tracking-wider text-white">
            Quick links
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {SRMS_QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <ExternalAnchor href={link.href} className="transition hover:text-white" showIcon>
                  {link.label}
                </ExternalAnchor>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-institutions">
          <h2
            id="footer-institutions"
            className="font-display text-sm font-semibold uppercase tracking-wider text-white"
          >
            SRMS Institutions
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {SRMS_INSTITUTIONS.map((link) => (
              <li key={link.href}>
                <ExternalAnchor href={link.href} className="transition hover:text-white">
                  {link.label}
                </ExternalAnchor>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8">
          © {year} Shri Ram Murti Smarak Institutions. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
