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

export function AdminPatents() {
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inhouse Patent Filing System · Administration"
        title="Applications"
        description="Search, filter and review submitted patent applications."
        actions={<RefreshButton />}
      />

      <AdminAlerts />

        {/* ====================================================
            APPLICATIONS
        ==================================================== */}

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <h2 className="text-2xl font-extrabold">
                  Patent Applications
                </h2>

                <p className="mt-1 text-sm text-slate-500">

                  Showing{" "}

                  <span className="font-bold text-slate-700">
                    {filteredPatents.length}
                  </span>{" "}

                  of{" "}

                  <span className="font-bold text-slate-700">
                    {patents.length}
                  </span>{" "}

                  applications.

                </p>

              </div>

              {/* FILTERS */}

              <div className="flex flex-wrap gap-2">

                {(
                  [
                    "All",
                    ...STATUS_OPTIONS,
                  ] as FilterStatus[]
                ).map((item) => (

                  <button
                    key={item}
                    onClick={() =>
                      setFilter(item)
                    }
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                      filter === item
                        ? "bg-brand text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item}
                  </button>

                ))}

              </div>

            </div>

          </div>

          {/* LOADING */}

          {loading ? (

            <div className="space-y-4 p-6">

              {[1, 2, 3].map(
                (item) => (

                  <div
                    key={item}
                    className="h-32 animate-pulse rounded-2xl bg-slate-100"
                  />

                )
              )}

            </div>

          ) : filteredPatents.length === 0 ? (

            <div className="p-16 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                ▤
              </div>

              <h3 className="mt-4 text-lg font-extrabold">
                No applications found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search
                or status filter.
              </p>

              {(search ||
                filter !== "All") && (

                <button
                  onClick={() => {
                    setSearch("");
                    setFilter("All");
                  }}
                  className="mt-5 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
                >
                  Clear Filters
                </button>

              )}

            </div>

          ) : (

            <div className="space-y-4 p-5 lg:p-6">

              {filteredPatents.map(
                (patent) => {

                  const completion =
                    getCompletion(
                      patent.completion
                    );

                  return (

                    <article
                      key={patent._id}
                      className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-md"
                    >

                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                        {/* INFO */}

                        <div className="min-w-0 flex-1">

                          <div className="mb-3 flex flex-wrap items-center gap-2">

                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                                patent.status
                              )}`}
                            >

                              <span
                                className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                                  patent.status
                                )}`}
                              />

                              {patent.status ??
                                "Draft"}

                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">

                              {completion}%
                              complete

                            </span>

                          </div>

                          <h3 className="text-lg font-extrabold leading-6 text-slate-900 transition group-hover:text-brand">

                            {patent.title ??
                              "Untitled Patent Application"}

                          </h3>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">

                            <span>

                              <strong className="text-slate-700">
                                Classification:
                              </strong>{" "}

                              {patent.classification ??
                                "Not classified"}

                            </span>

                            <span>

                              <strong className="text-slate-700">
                                Applicant:
                              </strong>{" "}

                              {getApplicantName(
                                patent
                              )}

                            </span>

                            <span>

                              <strong className="text-slate-700">
                                Submitted:
                              </strong>{" "}

                              {formatDate(
                                patent.submittedAt
                              )}

                            </span>

                          </div>

                          {patent.abstract && (

                            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-500">

                              {truncate(
                                patent.abstract
                              )}

                            </p>

                          )}

                          {/* REVIEW COMMENT */}

                          {patent.reviewComment && (

                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">

                              <div className="text-xs font-extrabold uppercase tracking-wide text-amber-700">
                                Admin Review
                              </div>

                              <p className="mt-1 text-sm text-amber-900">

                                {truncate(
                                  patent.reviewComment,
                                  150
                                )}

                              </p>

                            </div>

                          )}

                          {/* PROGRESS */}

                          <div className="mt-4 max-w-2xl">

                            <div className="mb-1 flex justify-between text-[11px] font-semibold text-slate-500">

                              <span>
                                Application completion
                              </span>

                              <span>
                                {completion}%
                              </span>

                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                              <div
                                className="h-full rounded-full bg-brand transition-all"
                                style={{
                                  width: `${completion}%`,
                                }}
                              />

                            </div>

                          </div>

                        </div>

                        {/* ACTIONS */}

                        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center xl:w-[330px] xl:justify-end">

                          <select
                            value={
                              patent.status ??
                              "Draft"
                            }
                            disabled={
                              updatingId ===
                              patent._id
                            }
                            onChange={(event) =>
                              updateStatus(
                                patent,
                                event.target
                                  .value as Status
                              )
                            }
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >

                            {STATUS_OPTIONS.map(
                              (status) => (

                                <option
                                  key={status}
                                  value={status}
                                >
                                  {status}
                                </option>

                              )
                            )}

                          </select>

                          <Link
                            to={`/admin/patents/${patent._id}`}
                            state={{ patent }}
                            className="btn-primary"
                          >
                            Review Application →
                          </Link>

                        </div>

                      </div>

                    </article>

                  );
                }
              )}

            </div>

          )}

        </section>

    </div>
  );
}
