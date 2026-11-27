import { ArrowRight, ClipboardCheck, FileText, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { homePathFor } from "../auth/paths";

const FEATURES = [
  {
    Icon: FileText,
    title: "Draft systematically",
    desc: "Guided sections keep every important part of the application organised, from background to claims and drawings.",
  },
  {
    Icon: ClipboardCheck,
    title: "Review clearly",
    desc: "Centralised documents and application status make administrative review faster and more transparent.",
  },
  {
    Icon: Users,
    title: "Collaborate by role",
    desc: "Applicants, faculty and administrators each get a focused workspace with the right permissions.",
  },
];

const WORKFLOW = ["Draft", "Submitted", "Under Review", "Changes Requested", "Approved"];

export function Landing() {
  const { user } = useAuth();

  return (
    <>
      {/* HERO */}
      <section className="border-b border-line bg-gradient-to-b from-white to-brand-50/60">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-8 lg:py-20">
          <div>
            <p className="eyebrow">SRMS College of Engineering &amp; Technology · Bareilly</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Turn an invention into a{" "}
              <span className="text-brand">filing-ready patent.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              The Inhouse Patent Filing System is the institution’s own platform for patent applications. Draft your application,
              upload supporting documents, submit for review and track every decision, all in one
              secure workspace.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <Link to={homePathFor(user.role)} className="btn-primary !px-6 !py-3">
                  Open your workspace <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-primary !px-6 !py-3">
                    Applicant / Faculty sign in <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link to="/register" className="btn-secondary !px-6 !py-3">
                    Create an account
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <img
              src="/assets/srmscet-campus.jpeg"
              alt="SRMS College of Engineering & Technology campus building"
              className="h-44 w-full object-cover sm:h-56"
            />
            <div className="p-6">
              <h2 className="font-display text-base font-semibold text-slate-900">
                From first draft to final decision
              </h2>
              <ol className="mt-4 flex flex-wrap gap-2" aria-label="Application workflow">
                {WORKFLOW.map((step, index) => (
                  <li
                    key={step}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-brand text-[10px] text-white">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="features-heading">
        <p className="eyebrow">Why the Inhouse Patent Filing System</p>
        <h2 id="features-heading" className="mt-2 text-3xl font-bold text-slate-900">
          Everything the filing process needs
        </h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {FEATURES.map(({ Icon, title, desc }) => (
            <article key={title} className="card p-6">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand">
                <Icon size={22} aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* PORTALS */}
      {!user && (
        <section className="border-t border-line bg-white" aria-labelledby="portals-heading">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <h2 id="portals-heading" className="text-2xl font-bold text-slate-900">
              Choose your portal
            </h2>
            <p className="mt-1 text-sm text-slate-600">Select the portal that matches your role.</p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Link to="/login" className="card group flex items-center gap-4 p-6 transition hover:border-brand-300 hover:shadow-md">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand text-white">
                  <Users size={22} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-semibold text-slate-900">Applicant / Faculty portal</span>
                  <span className="block text-sm text-slate-600">Create and manage patent applications.</span>
                </span>
                <ArrowRight className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-brand" size={18} aria-hidden="true" />
              </Link>

              <Link to="/admin/login" className="card group flex items-center gap-4 p-6 transition hover:border-brand-300 hover:shadow-md">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-charcoal text-white">
                  <ShieldCheck size={22} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-semibold text-slate-900">Administrator portal</span>
                  <span className="block text-sm text-slate-600">Review applications and documents.</span>
                </span>
                <ArrowRight className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-brand" size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
