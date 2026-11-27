import { ExternalLink as ExternalIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  href: string;
  className?: string;
  children: ReactNode;
  showIcon?: boolean;
}

/** Link to a site outside the app: new tab, safe rel, announced to screen readers. */
export function ExternalAnchor({ href, className, children, showIcon }: Props) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      {showIcon && <ExternalIcon aria-hidden="true" size={13} className="ml-1 inline" />}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
