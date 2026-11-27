import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { Alert } from "../components/ui/Alert";
import { BackButton } from "../components/ui/BackButton";
import { LoadingState } from "../components/ui/States";
import { PageHeader } from "../components/ui/PageHeader";
import { RefreshButton, AdminAlerts } from "./adminParts";
import { useAdmin } from "./AdminContext";
import {
  getDrawingUrl,
  getStatusClass,
  getStatusDot,
  getApplicantName,
  getApplicantEmail,
  formatDate,
  formatDateTime,
  truncate,
  getCompletion,
  STATUS_OPTIONS,
  API_BASE_URL,
  type Patent,
  type AdminDocument,
  type Status,
  type FilterStatus,
} from "./shared";

const SHORTCUTS = [
  {
    to: "/admin/patents",
    title: "Applications",
    desc: "Search, filter and review every submitted patent application.",
  },
  {
    to: "/admin/documents",
    title: "Document Review",
    desc: "Inspect uploaded documents and record review decisions.",
  },
];

export function AdminOverview() {
  const {
    patents,
    setPatents,
    documents,
    setDocuments,
    selectedPatent,
    setSelectedPatent,
    search,
    setSearch,
    filter,
    setFilter,
    loading,
    refreshing,
    updatingId,
    downloadingId,
    reviewComment,
    setReviewComment,
    updatingDocumentId,
    setUpdatingDocumentId,
    error,
    setError,
    success,
    setSuccess,
    loadDocuments,
    loadPatents,
    statistics,
    filteredPatents,
    updateStatus,
    updateDocumentReview,
    openAdminDocument,
    downloadPDF,
    loadReview,
    clearReview,
  } = useAdmin();

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Inhouse Patent Filing System · Administration"
        title="Administration & Tracking"
        description="Review submitted patent applications, inspect documents and manage application status from one centralised workspace."
        actions={<RefreshButton />}
      />

      <AdminAlerts />

      <div className="grid gap-4 md:grid-cols-2">
        {SHORTCUTS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="card group p-6 transition hover:border-brand-300 hover:shadow-md"
          >
            <h2 className="font-display text-lg font-semibold text-slate-900 group-hover:text-brand">
              {item.title} →
            </h2>
            <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
          </Link>
        ))}
      </div>

        {/* ====================================================
            STAT CARDS
        ==================================================== */}

        <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">

          {/* TOTAL */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <div className="text-sm font-semibold text-slate-500">
                  Total Applications
                </div>

                <div className="mt-2 text-3xl font-extrabold">
                  {statistics.total}
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  All patent records
                </div>

              </div>

              <div className="rounded-xl bg-slate-100 p-3 text-xl">
                ▤
              </div>

            </div>

          </div>

          {/* PENDING */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <div className="text-sm font-semibold text-slate-500">
                  Pending Review
                </div>

                <div className="mt-2 text-3xl font-extrabold text-brand">
                  {statistics.pending}
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  Need administrator action
                </div>

              </div>

              <div className="rounded-xl bg-brand-50 p-3 text-xl text-brand">
                ◷
              </div>

            </div>

          </div>

          {/* CHANGES */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <div className="text-sm font-semibold text-slate-500">
                  Changes Requested
                </div>

                <div className="mt-2 text-3xl font-extrabold text-amber-600">
                  {statistics.changes}
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  Waiting for applicant
                </div>

              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-xl text-amber-600">
                !
              </div>

            </div>

          </div>

          {/* APPROVED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <div className="text-sm font-semibold text-slate-500">
                  Approved
                </div>

                <div className="mt-2 text-3xl font-extrabold text-emerald-600">
                  {statistics.approved}
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  Successfully approved
                </div>

              </div>

              <div className="rounded-xl bg-emerald-50 p-3 text-xl text-emerald-600">
                ✓
              </div>

            </div>

          </div>

          {/* DRAFTS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>

                <div className="text-sm font-semibold text-slate-500">
                  Drafts
                </div>

                <div className="mt-2 text-3xl font-extrabold text-slate-700">
                  {statistics.drafts}
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  Not submitted
                </div>

              </div>

              <div className="rounded-xl bg-slate-100 p-3 text-xl">
                ✎
              </div>

            </div>

          </div>

        </section>

    </div>
  );
}
