import { Link } from "react-router-dom";

interface Props {
  to: string;
  /** Line under the product name. */
  subtitle?: string;
}

/** SRMS CET crest + product name. */
export function BrandMark({ to, subtitle = "SRMS College of Engineering & Technology, Bareilly" }: Props) {
  return (
    <Link to={to} className="flex min-w-0 items-center gap-3 rounded-lg">
      <img
        src="/assets/srmscet-logo.jpeg"
        alt="SRMS College of Engineering & Technology emblem"
        width={44}
        height={44}
        className="h-11 w-11 shrink-0 object-contain"
      />
      <span className="hidden h-9 w-px shrink-0 bg-line sm:block" aria-hidden="true" />
      <span className="min-w-0 leading-tight">
        <span className="block font-display text-[13px] font-bold leading-[1.15] tracking-tight text-brand sm:text-base lg:text-lg">
          Inhouse Patent Filing System
        </span>
        <span className="mt-0.5 hidden truncate text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:block">
          {subtitle}
        </span>
      </span>
    </Link>
  );
}
