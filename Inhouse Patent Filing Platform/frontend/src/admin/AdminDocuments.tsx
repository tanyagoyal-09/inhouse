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

export function AdminDocuments() {
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
        title="Document Review"
        description="Inspect uploaded documents and record review decisions."
        actions={<RefreshButton />}
      />

      <AdminAlerts />

        {/* ====================================================
            DOCUMENT REVIEW
        ==================================================== */}

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-6">

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-brand">
                  Document Review
                </div>

                <h2 className="mt-1 text-2xl font-extrabold">
                  Uploaded Documents
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review documents uploaded by applicants and faculty,
                  including their linked patent application.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">
                  Total {documents.length}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-2 text-amber-700">
                  Pending{" "}
                  {
                    documents.filter(
                      (item) =>
                        (item.adminReviewStatus ||
                          "Pending") === "Pending"
                    ).length
                  }
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">
                  Approved{" "}
                  {
                    documents.filter(
                      (item) =>
                        item.adminReviewStatus === "Approved"
                    ).length
                  }
                </span>
              </div>

            </div>

          </div>

          {documents.length === 0 ? (

            <div className="p-14 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                📄
              </div>

              <h3 className="mt-4 text-lg font-extrabold">
                No uploaded documents found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Documents uploaded from the applicant side will appear here.
              </p>

            </div>

          ) : (

            <div className="space-y-4 p-5 lg:p-6">

              {documents.map((document) => {

                const patent =
                  typeof document.patentId === "object"
                    ? document.patentId
                    : null;

                const uploader =
                  typeof document.uploadedBy === "object"
                    ? document.uploadedBy
                    : null;

                const reviewStatus =
                  document.adminReviewStatus ||
                  "Pending";

                const statusClass =
                  reviewStatus === "Approved"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : reviewStatus === "Changes Requested"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : reviewStatus === "Rejected"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-blue-50 text-blue-700 border-blue-200";

                return (
                  <article
                    key={document._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md"
                  >

                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            {document.documentType || "Other"}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass}`}
                          >
                            {reviewStatus}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            Validation:{" "}
                            {document.status || "Unknown"}
                          </span>

                        </div>

                        <h3 className="mt-3 break-all text-lg font-extrabold text-slate-900">
                          {document.originalName ||
                            document.name ||
                            "Untitled document"}
                        </h3>

                        <div className="mt-3 grid gap-2 text-sm text-slate-500 md:grid-cols-2">

                          <div>
                            <span className="font-bold text-slate-700">
                              Patent:
                            </span>{" "}
                            {patent?.title ||
                              "Not linked to a patent"}
                          </div>

                          <div>
                            <span className="font-bold text-slate-700">
                              Uploaded by:
                            </span>{" "}
                            {uploader?.name ||
                              "Applicant"}
                            {uploader?.email
                              ? ` (${uploader.email})`
                              : ""}
                          </div>

                          <div>
                            <span className="font-bold text-slate-700">
                              Uploaded:
                            </span>{" "}
                            {formatDateTime(
                              document.createdAt
                            )}
                          </div>

                          <div>
                            <span className="font-bold text-slate-700">
                              Size:
                            </span>{" "}
                            {typeof document.size === "number"
                              ? `${(
                                  document.size /
                                  (1024 * 1024)
                                ).toFixed(2)} MB`
                              : "—"}
                          </div>

                        </div>

                        {document.validationMessage && (
                          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                            <span className="font-bold">
                              Validation:
                            </span>{" "}
                            {document.validationMessage}
                          </p>
                        )}

                        {document.adminReviewComment && (
                          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <div className="text-xs font-extrabold uppercase tracking-wide text-amber-700">
                              Admin Review Comment
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-amber-900">
                              {document.adminReviewComment}
                            </p>
                          </div>
                        )}

                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 xl:w-[390px] xl:justify-end">

                        <button
                          onClick={() =>
                            openAdminDocument(document)
                          }
                          disabled={
                            document.status !==
                            "Validated"
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          View Document
                        </button>

                        <button
                          onClick={() => {
                            const element =
                              window.document.getElementById(
                                `document-review-${document._id}`
                              );

                            element?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }}
                          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
                        >
                          Review
                        </button>

                      </div>

                    </div>

                    <div
                      id={`document-review-${document._id}`}
                      className="mt-5 border-t border-slate-100 pt-5"
                    >

                      <label className="mb-2 block text-sm font-extrabold text-slate-800">
                        Administrator Document Review
                      </label>

                      <textarea
                        value={
                          document.adminReviewComment || ""
                        }
                        onChange={(event) => {
                          setDocuments((current) =>
                            current.map((item) =>
                              item._id === document._id
                                ? {
                                    ...item,
                                    adminReviewComment:
                                      event.target.value,
                                  }
                                : item
                            )
                          );
                        }}
                        placeholder="Write feedback for this document..."
                        rows={3}
                        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand-100"
                      />

                      <div className="mt-3 flex flex-wrap gap-2">

                        <button
                          onClick={() =>
                            updateDocumentReview(
                              document,
                              "Approved"
                            )
                          }
                          disabled={
                            updatingDocumentId ===
                            document._id
                          }
                          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          ✓ Approve Document
                        </button>

                        <button
                          onClick={() =>
                            updateDocumentReview(
                              document,
                              "Changes Requested"
                            )
                          }
                          disabled={
                            updatingDocumentId ===
                            document._id
                          }
                          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                        >
                          Request Changes
                        </button>

                        <button
                          onClick={() =>
                            updateDocumentReview(
                              document,
                              "Rejected"
                            )
                          }
                          disabled={
                            updatingDocumentId ===
                            document._id
                          }
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                        >
                          Reject
                        </button>

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>

          )}

        </section>

    </div>
  );
}
