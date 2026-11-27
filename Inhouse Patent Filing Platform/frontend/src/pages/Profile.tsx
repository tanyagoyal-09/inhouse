import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { PageHeader } from "../components/ui/PageHeader";

export function Profile() {
  const { user } = useAuth();

  const fields = [
    { label: "Full name", value: user?.name },
    { label: "Email address", value: user?.email },
    { label: "Role", value: user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : undefined },
    { label: "Department", value: user?.department },
  ];

  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Your account details as registered with the Inhouse Patent Filing System."
      />

      <section className="card max-w-3xl overflow-hidden" aria-label="Account details">
        <div className="flex items-center gap-4 border-b border-line bg-brand-50/60 p-5 sm:p-6">
          <div
            aria-hidden="true"
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand font-display text-xl font-bold text-white"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold text-slate-900">
              {user?.name || "User"}
            </p>
            <p className="truncate text-sm text-slate-600">{user?.email}</p>
          </div>
        </div>

        <dl className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
          {fields.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
                {value || "Not provided"}
              </dd>
            </div>
          ))}
        </dl>

        <div className="border-t border-line p-5 sm:p-6">
          <Link to="/patents" className="btn-secondary">
            View my patents
          </Link>
        </div>
      </section>
    </div>
  );
}
