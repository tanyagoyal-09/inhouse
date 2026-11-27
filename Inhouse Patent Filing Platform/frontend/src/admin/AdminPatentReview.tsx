import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { Alert } from "../components/ui/Alert";
import { BackButton } from "../components/ui/BackButton";
import { LoadingState } from "../components/ui/States";
import { PageHeader } from "../components/ui/PageHeader";
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

export function AdminPatentReview() {
  const { patentId = "" } = useParams();
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
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

  // Load the application named in the URL (works on refresh / direct link).
  useEffect(() => {
    let alive = true;
    const passed = (location.state as { patent?: Patent } | null)?.patent;
    const fallback = passed && passed._id === patentId ? passed : null;

    clearReview();
    setStatus("loading");
    loadReview(patentId, fallback).then((ok) => {
      if (alive) setStatus(ok ? "ready" : "missing");
    });

    return () => {
      alive = false;
      clearReview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patentId]);

  if (status === "loading") return <LoadingState label="Loading application…" />;

  if (status === "missing" || !selectedPatent || selectedPatent._id !== patentId) {
    return (
      <div className="mx-auto max-w-xl space-y-5 py-10">
        <Alert tone="error">This application could not be found.</Alert>
        <div className="flex gap-3">
          <Link to="/admin/patents" className="btn-primary">
            Go to Applications
          </Link>
          <BackButton fallback="/admin/patents" />
        </div>
      </div>
    );
  }

  const patent = selectedPatent;
  const completion = getCompletion(patent.completion);
  const applicantName = getApplicantName(patent);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inhouse Patent Filing System · Administration"
        title="Application Review"
        actions={
          <>
            <BackButton fallback="/admin/patents" />
            <button
              type="button"
              onClick={() => downloadPDF(patent)}
              disabled={downloadingId === patent._id}
              className="btn-primary"
            >
              {downloadingId === patent._id ? "Generating..." : "Download PDF"}
            </button>
          </>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

          {/* =================================================
              TITLE CARD
          ================================================= */}

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-900 p-7 text-white lg:p-8">

              <div className="flex flex-wrap items-start justify-between gap-6">

                <div className="max-w-4xl">

                  <div className="mb-3 flex flex-wrap items-center gap-2">

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                        patent.status
                      )}`}
                    >
                      {patent.status ??
                        "Draft"}
                    </span>

                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
                      {completion}% Complete
                    </span>

                  </div>

                  <h2 className="text-3xl font-extrabold leading-tight lg:text-4xl">
                    {patent.title ??
                      "Untitled Patent Application"}
                  </h2>

                  <p className="mt-4 text-sm text-slate-300">
                    {patent.classification ??
                      "Classification not provided"}
                  </p>

                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">

                  <div className="text-xs text-slate-300">
                    Submitted
                  </div>

                  <div className="mt-1 font-bold">
                    {formatDate(
                      patent.submittedAt
                    )}
                  </div>

                </div>

              </div>

            </div>

            <div className="p-6">

              <div className="mb-3 flex items-center justify-between text-sm">

                <span className="font-semibold text-slate-600">
                  Application completion
                </span>

                <span className="font-extrabold text-slate-900">
                  {completion}%
                </span>

              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                <div
                  className="h-full rounded-full bg-brand transition-all duration-500"
                  style={{
                    width: `${completion}%`,
                  }}
                />

              </div>

            </div>

          </section>

          {/* =================================================
              ADMIN DECISION
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div>

              <h3 className="font-extrabold text-slate-900">
                Administrator Decision
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Review the application and
                provide feedback to the
                applicant.
              </p>

            </div>

            {/* REVIEW COMMENT */}

            <div className="mt-5">

              <label className="mb-2 block text-sm font-extrabold text-slate-800">
                Review Comment
              </label>

              <textarea
                value={reviewComment}
                onChange={(event) =>
                  setReviewComment(
                    event.target.value
                  )
                }
                placeholder="Write the problem, correction, suggestion, or review feedback for the applicant..."
                rows={6}
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand-100"
              />

              <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                <p className="text-xs text-slate-500">
                  This comment will be
                  visible to the applicant.
                </p>

                <p className="text-xs font-semibold text-slate-500">
                  {reviewComment.length}{" "}
                  characters
                </p>

              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                ✓ {success}
              </div>
            )}

            {/* ACTIONS */}

            <div className="mt-5 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">

              <button
                onClick={() =>
                  updateStatus(
                    patent,
                    "Under Review"
                  )
                }
                disabled={
                  updatingId ===
                  patent._id
                }
                className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingId ===
                patent._id
                  ? "Saving..."
                  : "Under Review"}
              </button>

              <button
                onClick={() =>
                  updateStatus(
                    patent,
                    "Changes Requested"
                  )
                }
                disabled={
                  updatingId ===
                  patent._id
                }
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingId ===
                patent._id
                  ? "Saving..."
                  : "Request Changes"}
              </button>

              <button
                onClick={() =>
                  updateStatus(
                    patent,
                    "Approved"
                  )
                }
                disabled={
                  updatingId ===
                  patent._id
                }
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatingId ===
                patent._id
                  ? "Saving..."
                  : "✓ Approve Application"}
              </button>

            </div>

            {/* LAST REVIEW */}

            {patent.reviewedAt && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">

                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Last Reviewed
                </div>

                <div className="mt-1 text-sm font-bold text-slate-800">
                  {formatDateTime(
                    patent.reviewedAt
                  )}
                </div>

              </div>
            )}

          </section>

          {/* =================================================
              APPLICANT
          ================================================= */}

          <section className="grid gap-6 lg:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="mb-5">

                <div className="text-xs font-extrabold uppercase tracking-wider text-brand">
                  Applicant
                </div>

                <h3 className="mt-1 text-xl font-extrabold text-slate-900">
                  Applicant Information
                </h3>

              </div>

              <div className="flex items-center gap-4">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-lg font-extrabold text-brand">
                  {applicantName
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">

                  <div className="truncate font-extrabold text-slate-900">
                    {applicantName}
                  </div>

                  <div className="mt-1 break-all text-sm text-slate-500">
                    {getApplicantEmail(
                      patent
                    )}
                  </div>

                </div>

              </div>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">

                <div className="flex justify-between gap-4 text-sm">

                  <span className="text-slate-500">
                    Created
                  </span>

                  <span className="font-semibold text-slate-800">
                    {formatDate(
                      patent.createdAt
                    )}
                  </span>

                </div>

                <div className="flex justify-between gap-4 text-sm">

                  <span className="text-slate-500">
                    Submitted
                  </span>

                  <span className="font-semibold text-slate-800">
                    {formatDate(
                      patent.submittedAt
                    )}
                  </span>

                </div>

                <div className="flex justify-between gap-4 text-sm">

                  <span className="text-slate-500">
                    Updated
                  </span>

                  <span className="font-semibold text-slate-800">
                    {formatDate(
                      patent.updatedAt
                    )}
                  </span>

                </div>

              </div>

            </div>

            {/* BASIC INFORMATION */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

              <div className="mb-5">

                <div className="text-xs font-extrabold uppercase tracking-wider text-brand">
                  Application Information
                </div>

                <h3 className="mt-1 text-xl font-extrabold text-slate-900">
                  Patent Overview
                </h3>

              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div className="rounded-xl bg-slate-50 p-4">

                  <div className="text-xs font-semibold text-slate-500">
                    Classification
                  </div>

                  <div className="mt-2 font-bold text-slate-900">
                    {patent.classification ||
                      "Not provided"}
                  </div>

                </div>

                <div className="rounded-xl bg-slate-50 p-4">

                  <div className="text-xs font-semibold text-slate-500">
                    Current Status
                  </div>

                  <div className="mt-2 font-bold text-slate-900">
                    {patent.status ||
                      "Draft"}
                  </div>

                </div>

                <div className="rounded-xl bg-slate-50 p-4">

                  <div className="text-xs font-semibold text-slate-500">
                    Completion
                  </div>

                  <div className="mt-2 font-bold text-slate-900">
                    {completion}%
                  </div>

                </div>

                <div className="rounded-xl bg-slate-50 p-4">

                  <div className="text-xs font-semibold text-slate-500">
                    Drawings
                  </div>

                  <div className="mt-2 font-bold text-slate-900">
                    {patent.drawings
                      ?.length ?? 0}
                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              PATENT CONTENT
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6">

              <div className="text-xs font-extrabold uppercase tracking-wider text-brand">
                Patent Document
              </div>

              <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
                Application Details
              </h3>

            </div>

            <div className="space-y-7">

              {/* ABSTRACT */}

              <article>

                <h4 className="mb-2 font-extrabold text-slate-900">
                  Abstract
                </h4>

                <p className="whitespace-pre-wrap leading-7 text-slate-600">
                  {patent.abstract ||
                    "No abstract has been provided."}
                </p>

              </article>

              <div className="border-t border-slate-100" />

              {/* FIELD */}

              <article>

                <h4 className="mb-2 font-extrabold text-slate-900">
                  Field of Invention
                </h4>

                <p className="whitespace-pre-wrap leading-7 text-slate-600">
                  {patent.field ||
                    "No field of invention has been provided."}
                </p>

              </article>

              <div className="border-t border-slate-100" />

              {/* BACKGROUND */}

              <article>

                <h4 className="mb-4 font-extrabold text-slate-900">
                  Background
                </h4>

                <div className="space-y-5">

                  <div>

                    <h5 className="text-sm font-bold text-slate-700">
                      Prior Art
                    </h5>

                    <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-600">
                      {patent.backgroundPriorArt ||
                        "Not provided."}
                    </p>

                  </div>

                  <div>

                    <h5 className="text-sm font-bold text-slate-700">
                      Problems
                    </h5>

                    <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-600">
                      {patent.backgroundProblems ||
                        "Not provided."}
                    </p>

                  </div>

                  <div>

                    <h5 className="text-sm font-bold text-slate-700">
                      Need
                    </h5>

                    <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-600">
                      {patent.backgroundNeed ||
                        "Not provided."}
                    </p>

                  </div>

                </div>

              </article>

              <div className="border-t border-slate-100" />

              {/* SUMMARY */}

              <article>

                <h4 className="mb-4 font-extrabold text-slate-900">
                  Summary
                </h4>

                <div className="space-y-5">

                  <div>

                    <h5 className="text-sm font-bold text-slate-700">
                      Problem
                    </h5>

                    <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-600">
                      {patent.summaryProblem ||
                        "Not provided."}
                    </p>

                  </div>

                  <div>

                    <h5 className="text-sm font-bold text-slate-700">
                      Solution
                    </h5>

                    <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-600">
                      {patent.summarySolution ||
                        "Not provided."}
                    </p>

                  </div>

                  <div>

                    <h5 className="text-sm font-bold text-slate-700">
                      Components
                    </h5>

                    <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-600">
                      {patent.summaryComponents ||
                        "Not provided."}
                    </p>

                  </div>

                  <div>

                    <h5 className="text-sm font-bold text-slate-700">
                      Operation
                    </h5>

                    <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-600">
                      {patent.summaryOperation ||
                        "Not provided."}
                    </p>

                  </div>

                  <div>

                    <h5 className="text-sm font-bold text-slate-700">
                      Advantages
                    </h5>

                    <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-600">
                      {patent.summaryAdvantages ||
                        "Not provided."}
                    </p>

                  </div>

                </div>

              </article>

              <div className="border-t border-slate-100" />

              {/* DETAILED DESCRIPTION */}

              <article>

                <h4 className="mb-4 font-extrabold text-slate-900">
                  Detailed Description
                </h4>

                <div className="space-y-5">

                  <div>

                    <h5 className="text-sm font-bold text-slate-700">
                      Overview
                    </h5>

                    <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-600">
                      {patent.detailedOverview ||
                        "Not provided."}
                    </p>

                  </div>

                  <div>

                    <h5 className="text-sm font-bold text-slate-700">
                      Architecture
                    </h5>

                    <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-600">
                      {patent.detailedArchitecture ||
                        "Not provided."}
                    </p>

                  </div>

                  <div>

                    <h5 className="text-sm font-bold text-slate-700">
                      Operation
                    </h5>

                    <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-600">
                      {patent.detailedOperation ||
                        "Not provided."}
                    </p>

                  </div>

                  <div>

                    <h5 className="text-sm font-bold text-slate-700">
                      Implementation
                    </h5>

                    <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-600">
                      {patent.detailedImplementation ||
                        "Not provided."}
                    </p>

                  </div>

                  <div>

                    <h5 className="text-sm font-bold text-slate-700">
                      Embodiments
                    </h5>

                    <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-600">
                      {patent.detailedEmbodiments ||
                        "Not provided."}
                    </p>

                  </div>

                </div>

              </article>

              <div className="border-t border-slate-100" />

              {/* CLAIMS */}

              <article>

                <h4 className="mb-3 font-extrabold text-slate-900">
                  Claims
                </h4>

                {!patent.claims ||
                patent.claims.length === 0 ? (
                  <p className="text-slate-600">
                    No claims have been
                    provided.
                  </p>
                ) : (
                  <div className="space-y-4">

                    {patent.claims.map(
                      (claim, index) => (
                        <div
                          key={`${patent._id}-claim-${index}`}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                              Claim{" "}
                              {claim.number ??
                                index + 1}
                            </span>

                            {claim.type && (
                              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand">
                                {claim.type}
                              </span>
                            )}

                            {claim.dependsOn && (
                              <span className="text-xs font-semibold text-slate-500">
                                Depends on:{" "}
                                {claim.dependsOn}
                              </span>
                            )}

                          </div>

                          <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
                            {claim.text ||
                              "No claim text provided."}
                          </p>

                        </div>
                      )
                    )}

                  </div>
                )}

              </article>

            </div>

          </section>

          {/* =================================================
              DRAWINGS
          ================================================= */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            {/* HEADER */}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

              <div>

                <div className="text-xs font-extrabold uppercase tracking-wider text-brand">
                  Technical Drawings
                </div>

                <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Patent Figures
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Drawings uploaded by the applicant for this patent application.
                </p>

              </div>

              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">

                {patent.drawings?.length ?? 0}{" "}

                {patent.drawings?.length === 1
                  ? "figure"
                  : "figures"}

              </div>

            </div>

            {/* NO DRAWINGS */}

            {!patent.drawings ||
            patent.drawings.length === 0 ? (

              <div className="rounded-2xl border border-dashed border-slate-300 p-5 sm:p-10 text-center">

                <div className="text-4xl">
                  📐
                </div>

                <h4 className="mt-3 font-extrabold text-slate-900">
                  No drawings uploaded
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  No technical drawings have been uploaded for this application.
                </p>

              </div>

            ) : (

              /* DRAWING GRID */

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                {patent.drawings.map(
                  (drawing, index) => {

                    const imageUrl =
                      getDrawingUrl(
                        drawing.preview ||
                        drawing.filePath
                      );

                    return (

                      <article
                        key={`${drawing.fileName || "drawing"}-${index}`}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                      >

                        {/* IMAGE */}

                        <div className="relative flex h-64 items-center justify-center bg-slate-50">

                          {imageUrl ? (

                            <img
                              src={imageUrl}
                              alt={`Figure ${
                                drawing.figureNumber ??
                                index + 1
                              }`}
                              className="h-full w-full object-contain p-3"
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.style.display =
                                  "none";

                                const parent =
                                  event.currentTarget
                                    .parentElement;

                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="flex h-full w-full items-center justify-center text-center text-sm text-slate-500">
                                      <div>
                                        <div class="mb-2 text-3xl">🖼️</div>
                                        <div>Drawing preview unavailable</div>
                                      </div>
                                    </div>
                                  `;
                                }
                              }}
                            />

                          ) : (

                            <div className="text-center text-sm text-slate-500">

                              <div className="mb-2 text-4xl">
                                🖼️
                              </div>

                              <div>
                                Drawing preview unavailable
                              </div>

                            </div>

                          )}

                        </div>

                        {/* DRAWING INFORMATION */}

                        <div className="p-4">

                          {/* Figure number + status */}

                          <div className="flex flex-wrap items-center justify-between gap-2">

                            <div className="font-extrabold text-slate-900">

                              Figure{" "}

                              {drawing.figureNumber ??
                                index + 1}

                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                drawing.status ===
                                "valid"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : drawing.status ===
                                    "warning"
                                  ? "bg-amber-50 text-amber-700"
                                  : drawing.status ===
                                    "invalid"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >

                              {drawing.status ||
                                "Uploaded"}

                            </span>

                          </div>

                          {/* Description */}

                          <div className="mt-3">

                            <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                              Description
                            </div>

                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                              {drawing.description ||
                                "No description provided."}
                            </p>

                          </div>

                          {/* Reference numbers */}

                          {drawing.referenceNumbers && (

                            <div className="mt-3">

                              <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                                Reference Numbers
                              </div>

                              <p className="mt-1 text-sm font-semibold text-slate-600">
                                {drawing.referenceNumbers}
                              </p>

                            </div>

                          )}

                          {/* File information */}

                          <div className="mt-4 space-y-1 border-t border-slate-100 pt-3">

                            {drawing.fileName && (

                              <div className="break-all text-xs text-slate-500">

                                <span className="font-bold text-slate-700">
                                  File:
                                </span>{" "}

                                {drawing.fileName}

                              </div>

                            )}

                            {typeof drawing.size ===
                              "number" && (

                              <div className="text-xs text-slate-500">

                                <span className="font-bold text-slate-700">
                                  Size:
                                </span>{" "}

                                {(
                                  drawing.size /
                                  (1024 * 1024)
                                ).toFixed(2)}{" "}
                                MB

                              </div>

                            )}

                          </div>

                          {/* OPEN DRAWING */}

                          {imageUrl && (

                            <a
                              href={imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 block rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                            >
                              Open Full Drawing ↗
                            </a>

                          )}

                        </div>

                      </article>

                    );
                  }
                )}

              </div>

            )}

          </section>

          {/* =================================================
              FINAL REVIEW
          ================================================= */}

          <section className="rounded-3xl bg-charcoal p-6 text-white shadow-lg">

            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="text-lg font-extrabold">
                  Final Review
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Your review comment above
                  will be saved with the
                  decision.
                </p>

              </div>

              <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">

                <button
                  onClick={() =>
                    updateStatus(
                      patent,
                      "Changes Requested"
                    )
                  }
                  disabled={
                    updatingId ===
                    patent._id
                  }
                  className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingId ===
                  patent._id
                    ? "Saving..."
                    : "Request Changes"}
                </button>

                <button
                  onClick={() =>
                    updateStatus(
                      patent,
                      "Approved"
                    )
                  }
                  disabled={
                    updatingId ===
                    patent._id
                  }
                  className="rounded-xl bg-emerald-500 px-5 py-3 font-extrabold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingId ===
                  patent._id
                    ? "Saving..."
                    : "✓ Approve Application"}
                </button>

              </div>

            </div>

          </section>

    </div>
  );
}
