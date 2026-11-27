import { ArrowLeft } from "lucide-react";

import { useGoBack } from "../../navigation/NavigationTracker";

interface Props {
  /** Where to go when the page was opened directly and there is no in-app history. */
  fallback: string;
  label?: string;
  className?: string;
}

/**
 * "Back" that behaves like the browser's Back button (see useGoBack).
 * Never hard-codes a jump to the dashboard when real history exists.
 */
export function BackButton({ fallback, label = "Back", className = "btn-secondary" }: Props) {
  const goBack = useGoBack(fallback);
  return (
    <button type="button" onClick={goBack} className={className}>
      <ArrowLeft size={16} aria-hidden="true" />
      {label}
    </button>
  );
}
