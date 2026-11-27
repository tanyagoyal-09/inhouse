import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="card flex items-center justify-center gap-3 p-10 text-sm font-semibold text-slate-600"
    >
      <LoaderCircle aria-hidden="true" className="animate-spin text-brand" size={20} />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card border-dashed p-10 text-center">
      <h2 className="font-display text-lg font-semibold text-slate-900">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
