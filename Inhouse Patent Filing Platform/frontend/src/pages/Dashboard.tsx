import {
  Activity,
  ArrowRight,
  CircleCheck,
  Clock3,
  FilePlus2,
  FileText,
  FolderOpen,
  PenLine,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { EmptyState, LoadingState } from "../components/ui/States";
import api from "../services/api";
import type { Patent } from "../types";

const STATUS_STYLE: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-purple-50 text-purple-700",
  "Under Review": "bg-blue-50 text-blue-700",
  "Changes Requested": "bg-amber-50 text-amber-800",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

/** Every major feature, one card each – the "easy to discover" entry points. */
const WORKSPACE = [
  {
    to: "/patents/new",
    title: "New Patent Draft",
    desc: "Start a guided patent application.",
    Icon: FilePlus2,
  },
  {
    to: "/patents",
    title: "My Patents",
    desc: "Browse, search and edit your applications.",
    Icon: FileText,
  },
  {
    to: "/documents",
    title: "Documents",
    desc: "Generate and manage filing documents.",
    Icon: FolderOpen,
  },
  {
    to: "/tracking",
    title: "Tracking",
    desc: "Follow review status and decisions.",
    Icon: Activity,
  },
  {
    to: "/profile",
    title: "Profile",
    desc: "Your account and department details.",
    Icon: UserRound,
  },
];

export function Dashboard() {
  const { user } = useAuth();
  const [patents, setPatents] = useState<Patent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPatents = async () => {
      try {
        const response = await api.get("/patents");
        if (mounted) setPatents(response.data?.patents || []);
      } catch (error) {
        console.error("Unable to load patents:", error);
        if (mounted) setPatents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPatents();
    return () => {
      mounted = false;
    };
  }, []);

  const count = (status: string) => patents.filter((p) => p.status === status).length;

  const stats = [
    { title: "Total Patents", value: patents.length, description: "All applications", Icon: FileText },
    { title: "Drafts", value: count("Draft"), description: "Work in progress", Icon: PenLine },
    { title: "Under Review", value: count("Under Review"), description: "Awaiting review", Icon: Clock3 },
    { title: "Approved", value: count("Approved"), description: "Successfully approved", Icon: CircleCheck },
  ];

  const recentPatents = patents.slice(0, 5);
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="space-y-8">
      {/* Hero banner */}
      <section className="on-dark relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-7 text-white shadow-card sm:p-9">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/5" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-100">Inhouse Patent Filing System</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {firstName ? `Welcome, ${firstName}` : "Manage your intellectual property"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-brand-50 sm:text-base">
            Create, organise, review and track your patent applications from one centralised
            workspace.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/patents/new" className="btn w-full bg-white text-brand-700 hover:bg-brand-50 sm:w-auto">
              <FilePlus2 size={18} aria-hidden="true" />
              Start New Patent
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/patents" className="btn w-full border border-white/40 text-white hover:bg-white/10 sm:w-auto">
              <FolderOpen size={18} aria-hidden="true" />
              View My Patents
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section aria-label="Application statistics">
        {loading ? (
          <LoadingState label="Loading your applications…" />
        ) : (
          <dl className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {stats.map(({ title, value, description, Icon }) => (
              <div key={title} className="card flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand sm:h-12 sm:w-12">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <div>
                  <dt className="text-sm font-semibold text-slate-600">{title}</dt>
                  <dd className="font-display text-3xl font-bold text-slate-900">{value}</dd>
                  <p className="text-xs text-slate-500">{description}</p>
                </div>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* Feature cards */}
      <section aria-labelledby="workspace-heading">
        <h2 id="workspace-heading" className="text-xl font-bold text-slate-900">
          Your workspace
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
          {WORKSPACE.map(({ to, title, desc, Icon }) => (
            <Link
              key={to}
              to={to}
              className="card group flex flex-col p-4 transition last:col-span-2 md:last:col-span-1 sm:p-5 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand transition group-hover:bg-brand group-hover:text-white">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="mt-3 font-display text-sm font-semibold text-slate-900 sm:text-base">{title}</span>
              <span className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">{desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent */}
      <section aria-labelledby="recent-heading">
        <div className="flex items-center justify-between">
          <h2 id="recent-heading" className="text-xl font-bold text-slate-900">
            Recent applications
          </h2>
          {patents.length > 0 && (
            <Link to="/patents" className="text-sm font-bold text-brand hover:underline">
              View all
            </Link>
          )}
        </div>

        <div className="mt-4">
          {!loading && recentPatents.length === 0 && (
            <EmptyState
              title="No patent applications yet"
              description="Start your first draft and it will appear here."
              action={
                <Link to="/patents/new" className="btn-primary">
                  Start New Patent
                </Link>
              }
            />
          )}

          {recentPatents.length > 0 && (
            <ul className="card divide-y divide-line overflow-hidden">
              {recentPatents.map((patent) => (
                <li key={patent._id}>
                  <Link
                    to={`/patents/${patent._id}`}
                    state={{ patent }}
                    className="flex flex-col gap-2 p-4 transition hover:bg-brand-50/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-slate-900">{patent.title}</span>
                      <span className="block text-sm text-slate-500">
                        {patent.classification || "Unclassified"}
                      </span>
                    </span>
                    <span
                      className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                        STATUS_STYLE[patent.status] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {patent.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
