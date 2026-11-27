import {
  useEffect,
  useState,
} from "react";

import api from "../services/api";

import type { Patent } from "../types";

interface PatentHistory {
  _id?: string;
  status:
    | "Draft"
    | "Submitted"
    | "Under Review"
    | "Changes Requested"
    | "Approved";
  action: string;
  comment?: string;
  performedBy?: string;
  performedByName?: string;
  performedByEmail?: string;
  timestamp?: string;
}

interface PatentDetailsProps {
  patent: Patent;
  onBack: () => void;
}

export function PatentDetails({
  patent,
  onBack,
}: PatentDetailsProps) {
  const [data, setData] =
    useState<any>(patent);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [pdfLoading, setPdfLoading] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD COMPLETE PATENT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        try {
          const response =
            await api.get(
              `/patents/${patent._id}`
            );

          if (
            mounted &&
            response.data?.patent
          ) {
            setData(
              response.data.patent
            );
          }
        } catch (detailError) {
          console.error(
            "Unable to load detailed patent:",
            detailError
          );

          /*
           * Keep the patent already received
           * from My Patents.
           */
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError(
            "Unable to load patent details."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [patent._id]);

  /*
  |--------------------------------------------------------------------------
  | VALUE HELPER
  |--------------------------------------------------------------------------
  */

  const displayValue = (
    value: any
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return "Not provided";
    }

    if (Array.isArray(value)) {
      if (!value.length) {
        return "None";
      }

      return value;
    }

    return String(value);
  };

  /*
  |--------------------------------------------------------------------------
  | DATE HELPER
  |--------------------------------------------------------------------------
  */

  const formatDate = (
    value: any
  ) => {
    if (!value) {
      return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  /*
  |--------------------------------------------------------------------------
  | STATUS STYLE
  |--------------------------------------------------------------------------
  */

  const statusClass = () => {
    switch (data.status) {
      case "Approved":
        return "bg-green-100 text-green-700";

      case "Changes Requested":
        return "bg-amber-100 text-amber-700";

      case "Under Review":
        return "bg-blue-100 text-blue-700";

      case "Submitted":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | REVIEW DECISION STYLE
  |--------------------------------------------------------------------------
  */

  const reviewDecisionClass = () => {
    switch (data.reviewDecision) {
      case "Approved":
        return "border-emerald-200 bg-emerald-50 text-emerald-800";

      case "Changes Requested":
        return "border-amber-200 bg-amber-50 text-amber-800";

      case "Rejected":
        return "border-red-200 bg-red-50 text-red-800";

      default:
        return "border-slate-200 bg-slate-50 text-slate-700";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | HISTORY EVENT STYLE
  |--------------------------------------------------------------------------
  */

  const historyClass = (
    status: PatentHistory["status"]
  ) => {
    switch (status) {
      case "Approved":
        return {
          dot: "bg-emerald-500",
          box: "border-emerald-200 bg-emerald-50",
          title: "text-emerald-800",
        };

      case "Changes Requested":
        return {
          dot: "bg-amber-500",
          box: "border-amber-200 bg-amber-50",
          title: "text-amber-800",
        };

      case "Under Review":
      case "Submitted":
        return {
          dot: "bg-blue-500",
          box: "border-blue-200 bg-blue-50",
          title: "text-blue-800",
        };

      default:
        return {
          dot: "bg-slate-500",
          box: "border-slate-200 bg-slate-50",
          title: "text-slate-800",
        };
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DOWNLOAD PATENT PDF
  |--------------------------------------------------------------------------
  */

  const handleDownloadPDF =
    async () => {
      try {
        setPdfLoading(true);
        setError("");

        const response =
          await api.post(
            `/patents/${
              data._id ||
              patent._id
            }/pdf`,
            {},
            {
              responseType: "blob",
            }
          );

        const blob =
          new Blob(
            [response.data],
            {
              type:
                "application/pdf",
            }
          );

        const url =
          window.URL.createObjectURL(
            blob
          );

        const safeTitle =
          String(
            data.title ||
              "Patent-Application"
          )
            .trim()
            .replace(
              /[^a-z0-9]+/gi,
              "-"
            )
            .replace(
              /^-+|-+$/g,
              ""
            );

        const fileName =
          `${
            safeTitle ||
            "Patent-Application"
          }.pdf`;

        const link =
          document.createElement(
            "a"
          );

        link.href = url;
        link.download = fileName;

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

        window.URL.revokeObjectURL(
          url
        );
      } catch (err: any) {
        console.error(
          "PDF generation error:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
            "Unable to generate the patent PDF. Please try again."
        );
      } finally {
        setPdfLoading(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | SECTION COMPONENT
  |--------------------------------------------------------------------------
  */

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-extrabold text-brand">
        {title}
      </h2>

      {children}
    </section>
  );

  /*
  |--------------------------------------------------------------------------
  | FIELD COMPONENT
  |--------------------------------------------------------------------------
  */

  const Field = ({
    label,
    value,
  }: {
    label: string;
    value: any;
  }) => (
    <div className="rounded-xl border border-line bg-slate-50 p-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
        {displayValue(value)}
      </div>
    </div>
  );

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="p-2">
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-8">
          <div className="text-lg font-semibold text-slate-600">
            Loading patent details...
          </div>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

  if (error && !data) {
    return (
      <div className="p-2">
        <button
          onClick={onBack}
          className="mb-5 rounded-xl border border-line bg-white px-4 py-2 font-semibold text-brand"
        >
          ← Back
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ARRAYS
  |--------------------------------------------------------------------------
  */

  const drawings =
    Array.isArray(data.drawings)
      ? data.drawings
      : [];

  const components =
    Array.isArray(data.components)
      ? data.components
      : [];

  const claims =
    Array.isArray(data.claims)
      ? data.claims
      : [];

  const history: PatentHistory[] =
    Array.isArray(data.history)
      ? [...data.history].sort(
          (
            a: PatentHistory,
            b: PatentHistory
          ) => {
            const first = a.timestamp
              ? new Date(
                  a.timestamp
                ).getTime()
              : 0;

            const second =
              b.timestamp
                ? new Date(
                    b.timestamp
                  ).getTime()
                : 0;

            return first - second;
          }
        )
      : [];

  /*
  |--------------------------------------------------------------------------
  | REVIEW REPORT STATE
  |--------------------------------------------------------------------------
  */

  const hasReviewReport =
    Boolean(
      data.reviewDecision ||
        data.reviewComment ||
        data.reviewedAt ||
        data.reviewerName ||
        data.reviewerEmail ||
        data.reportGeneratedAt
    );

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <div className="p-2">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              onClick={onBack}
              className="mb-3 font-semibold text-brand hover:underline"
            >
              ← Back
            </button>

            <h1 className="text-3xl font-extrabold text-slate-900">
              Patent Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Complete patent application information
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-4 py-2 text-sm font-bold ${statusClass()}`}
            >
              {data.status ||
                "Draft"}
            </span>

            {data.completion !==
              undefined && (
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                {data.completion}%
                Complete
              </span>
            )}

            <button
              onClick={
                handleDownloadPDF
              }
              disabled={
                pdfLoading
              }
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pdfLoading
                ? "Generating PDF..."
                : "Download PDF"}
            </button>
          </div>
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =====================================================
            TITLE CARD
        ===================================================== */}

        <div className="mb-6 rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Patent Application
          </div>

          <h2 className="mt-2 text-2xl font-extrabold text-brand">
            {data.title ||
              "Untitled Patent"}
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Classification"
              value={
                data.classification
              }
            />

            <Field
              label="Field"
              value={data.field}
            />

            <Field
              label="Keywords"
              value={
                data.keywords
              }
            />

            <Field
              label="Status"
              value={
                data.status
              }
            />
          </div>
        </div>

        {/* =====================================================
            REVIEW REPORT
        ===================================================== */}

        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 bg-slate-50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">

              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-brand">
                  Administrative Review
                </div>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Review Report
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review information recorded by the administrator.
                </p>
              </div>

              {hasReviewReport ? (
                <span
                  className={`rounded-full border px-4 py-2 text-sm font-bold ${reviewDecisionClass()}`}
                >
                  {data.reviewDecision ||
                    data.status ||
                    "Review Recorded"}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
                  Awaiting Review
                </span>
              )}
            </div>
          </div>

          <div className="p-6">

            {!hasReviewReport ? (
              <div className="rounded-xl border border-brand-100 bg-brand-50 p-5">
                <div className="font-bold text-brand-900">
                  No review report is available yet.
                </div>

                <p className="mt-1 text-sm leading-6 text-brand-800">
                  Your application is waiting for administrative review. Once an administrator reviews the application, the decision and review information will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-5">

                {/* DECISION INFORMATION */}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Decision
                    </div>

                    <div className="mt-2 font-extrabold text-slate-900">
                      {data.reviewDecision ||
                        data.status ||
                        "Not specified"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reviewer
                    </div>

                    <div className="mt-2 font-extrabold text-slate-900">
                      {data.reviewerName ||
                        "Administrator"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reviewed On
                    </div>

                    <div className="mt-2 font-bold text-slate-900">
                      {formatDate(
                        data.reviewedAt
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Report Updated
                    </div>

                    <div className="mt-2 font-bold text-slate-900">
                      {formatDate(
                        data.reportGeneratedAt
                      )}
                    </div>
                  </div>

                </div>

                {/* REVIEWER EMAIL */}

                {data.reviewerEmail && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reviewer Email
                    </div>

                    <div className="mt-2 break-all text-sm font-semibold text-slate-800">
                      {data.reviewerEmail}
                    </div>
                  </div>
                )}

                {/* REVIEW COMMENTS */}

                <div>
                  <div className="mb-2 text-sm font-extrabold text-slate-900">
                    Review Comments
                  </div>

                  <div
                    className={`rounded-xl border p-5 ${reviewDecisionClass()}`}
                  >
                    {data.reviewComment ? (
                      <p className="whitespace-pre-wrap text-sm leading-7">
                        {data.reviewComment}
                      </p>
                    ) : (
                      <p className="text-sm">
                        No review comments were provided.
                      </p>
                    )}
                  </div>
                </div>

                {/* REVIEW SUMMARY */}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">

                  <div className="text-sm font-extrabold text-slate-900">
                    Review Summary
                  </div>

                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">

                    <div>
                      <span className="text-slate-500">
                        Application Status:
                      </span>{" "}
                      <span className="font-bold text-slate-800">
                        {data.status ||
                          "Not available"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500">
                        Review Decision:
                      </span>{" "}
                      <span className="font-bold text-slate-800">
                        {data.reviewDecision ||
                          "Not recorded"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500">
                        Reviewed:
                      </span>{" "}
                      <span className="font-bold text-slate-800">
                        {formatDate(
                          data.reviewedAt
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500">
                        Report Generated:
                      </span>{" "}
                      <span className="font-bold text-slate-800">
                        {formatDate(
                          data.reportGeneratedAt
                        )}
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            )}

          </div>
        </section>

        {/* =====================================================
            SUBMISSION / REVIEW HISTORY
        ===================================================== */}

        <section className="mb-6 rounded-2xl border border-line bg-white p-6 shadow-sm">

          <div className="mb-5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Application Activity
            </div>

            <h2 className="mt-1 text-xl font-extrabold text-brand">
              Submission & Review History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Chronological record of important application events.
            </p>
          </div>

          {history.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              No application history is available yet.
            </div>
          ) : (
            <div className="relative">

              {/* Timeline line */}

              <div className="absolute bottom-5 left-[15px] top-5 w-0.5 bg-slate-200" />

              <div className="space-y-5">

                {history.map(
                  (
                    event,
                    index
                  ) => {

                    const styles =
                      historyClass(
                        event.status
                      );

                    return (
                      <div
                        key={
                          event._id ||
                          `${event.timestamp}-${index}`
                        }
                        className="relative flex gap-4"
                      >

                        {/* Timeline dot */}

                        <div
                          className={[
                            "relative z-10 mt-1 h-8 w-8 shrink-0 rounded-full border-4 border-white",
                            styles.dot,
                          ].join(" ")}
                        />

                        {/* Event */}

                        <div
                          className={[
                            "min-w-0 flex-1 rounded-xl border p-4",
                            styles.box,
                          ].join(" ")}
                        >

                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">

                            <div>
                              <h3
                                className={[
                                  "text-sm font-bold",
                                  styles.title,
                                ].join(" ")}
                              >
                                {event.action}
                              </h3>

                              <div className="mt-1 text-xs font-semibold text-slate-500">
                                Status:{" "}
                                {event.status}
                              </div>
                            </div>

                            <div className="shrink-0 text-xs text-slate-500">
                              {formatDate(
                                event.timestamp
                              )}
                            </div>

                          </div>

                          {event.comment?.trim() && (
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                              {event.comment}
                            </p>
                          )}

                          {event.performedByName && (
                            <div className="mt-3 border-t border-black/5 pt-3 text-xs text-slate-500">
                              <span className="font-semibold">
                                Performed by:
                              </span>{" "}
                              {
                                event.performedByName
                              }

                              {event.performedByEmail && (
                                <>
                                  {" "}
                                  (
                                  {
                                    event.performedByEmail
                                  }
                                  )
                                </>
                              )}
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  }
                )}

              </div>
            </div>
          )}

        </section>

        {/* =====================================================
            ACTION REQUIRED
        ===================================================== */}

        {data.status ===
          "Changes Requested" && (
          <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">

            <h2 className="text-lg font-extrabold text-amber-900">
              Changes Required
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              The administrator has requested changes to this application. Review the comments above, update the patent application, and resubmit it for another review.
            </p>

            {data.reviewComment && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
                <div className="text-xs font-bold uppercase tracking-wide text-amber-700">
                  Administrator Instructions
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">
                  {data.reviewComment}
                </p>
              </div>
            )}

          </section>
        )}

        {/* =====================================================
            BACKGROUND
        ===================================================== */}

        <div className="space-y-6">

          <Section title="Background">

            <div className="grid gap-4">

              <Field
                label="Prior Art"
                value={
                  data.backgroundPriorArt
                }
              />

              <Field
                label="Problems Addressed"
                value={
                  data.backgroundProblems
                }
              />

              <Field
                label="Need for Invention"
                value={
                  data.backgroundNeed
                }
              />

            </div>

          </Section>

          {/* ===================================================
              SUMMARY
          =================================================== */}

          <Section title="Summary of Invention">

            <div className="grid gap-4 md:grid-cols-2">

              <Field
                label="Problem Addressed"
                value={
                  data.summaryProblem
                }
              />

              <Field
                label="Proposed Solution"
                value={
                  data.summarySolution
                }
              />

              <Field
                label="Main Components"
                value={
                  data.summaryComponents
                }
              />

              <Field
                label="Operation"
                value={
                  data.summaryOperation
                }
              />

              <div className="md:col-span-2">

                <Field
                  label="Advantages"
                  value={
                    data.summaryAdvantages
                  }
                />

              </div>

            </div>

          </Section>

          {/* ===================================================
              DETAILED DESCRIPTION
          =================================================== */}

          <Section title="Detailed Description">

            <div className="grid gap-4">

              <Field
                label="Detailed Overview"
                value={
                  data.detailedOverview
                }
              />

              <Field
                label="Detailed Architecture"
                value={
                  data.detailedArchitecture
                }
              />

              <Field
                label="Detailed Operation"
                value={
                  data.detailedOperation
                }
              />

              <Field
                label="Detailed Implementation"
                value={
                  data.detailedImplementation
                }
              />

              <Field
                label="Detailed Embodiments"
                value={
                  data.detailedEmbodiments
                }
              />

            </div>

          </Section>

          {/* ===================================================
              ABSTRACT
          =================================================== */}

          <Section title="Abstract">

            <div className="rounded-xl border border-line bg-slate-50 p-5">

              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                {displayValue(
                  data.abstract
                )}
              </p>

            </div>

          </Section>

          {/* ===================================================
              APPLICANT
          =================================================== */}

          <Section title="Applicant & Inventor Information">

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              <Field
                label="Applicant Name"
                value={
                  data.applicantName ||
                  data.applicant
                }
              />

              <Field
                label="Applicant Email"
                value={
                  data.applicantEmail
                }
              />

              <Field
                label="Department"
                value={
                  data.applicantDepartment
                }
              />

              <Field
                label="Inventors"
                value={
                  data.inventors
                }
              />

              <Field
                label="Guide Name"
                value={
                  data.guideName
                }
              />

              <Field
                label="Guide Email"
                value={
                  data.guideEmail
                }
              />

            </div>

          </Section>

          {/* ===================================================
              COMPONENTS
          =================================================== */}

          <Section title="Components">

            {components.length ===
            0 ? (
              <p className="text-sm text-slate-500">
                No components added.
              </p>
            ) : (
              <div className="space-y-4">

                {components.map(
                  (
                    component: any,
                    index: number
                  ) => (
                    <div
                      key={
                        component.id ||
                        index
                      }
                      className="rounded-xl border border-line p-4"
                    >

                      <div className="font-bold text-brand">
                        {component.referenceNumber ||
                          `Component ${
                            index + 1
                          }`}{" "}
                        —{" "}
                        {component.name ||
                          "Unnamed Component"}
                      </div>

                      <div className="mt-1 text-sm text-slate-600">
                        {component.description ||
                          "No description provided."}
                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </Section>

          {/* ===================================================
              CLAIMS
          =================================================== */}

          <Section title="Claims">

            {claims.length ===
            0 ? (
              <p className="text-sm text-slate-500">
                No claims added.
              </p>
            ) : (
              <div className="space-y-4">

                {claims.map(
                  (
                    claim: any,
                    index: number
                  ) => (
                    <div
                      key={
                        claim.id ||
                        index
                      }
                      className="rounded-xl border border-line p-5"
                    >

                      <div className="mb-2 flex flex-wrap items-center gap-2">

                        <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
                          Claim{" "}
                          {claim.number ||
                            index + 1}
                        </span>

                        {claim.type && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {claim.type}
                          </span>
                        )}

                        {claim.dependsOn && (
                          <span className="text-xs text-slate-500">
                            Depends on:{" "}
                            {
                              claim.dependsOn
                            }
                          </span>
                        )}

                      </div>

                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">
                        {claim.text ||
                          "No claim text provided."}
                      </p>

                    </div>
                  )
                )}

              </div>
            )}

          </Section>

          {/* ===================================================
              DRAWINGS
          =================================================== */}

          <Section title="Drawings">

            {drawings.length ===
            0 ? (
              <p className="text-sm text-slate-500">
                No drawings uploaded.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                {drawings.map(
                  (
                    drawing: any,
                    index: number
                  ) => (
                    <div
                      key={
                        drawing.id ||
                        drawing.fileName ||
                        index
                      }
                      className="rounded-xl border border-line p-4"
                    >

                      {drawing.preview ? (
                        <img
                          src={
                            drawing.preview
                          }
                          alt={`Figure ${
                            drawing.figureNumber ||
                            index + 1
                          }`}
                          className="mb-3 max-h-64 w-full rounded-lg border object-contain"
                        />
                      ) : (
                        <div className="mb-3 flex h-40 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">
                          No preview
                        </div>
                      )}

                      <div className="font-bold text-brand">
                        Figure{" "}
                        {drawing.figureNumber ||
                          index + 1}
                      </div>

                      <div className="mt-1 text-sm text-slate-600">
                        {drawing.description ||
                          "No description provided."}
                      </div>

                      {drawing.referenceNumbers && (
                        <div className="mt-2 text-xs font-semibold text-slate-500">
                          References:{" "}
                          {
                            drawing.referenceNumbers
                          }
                        </div>
                      )}

                    </div>
                  )
                )}

              </div>
            )}

          </Section>

          {/* ===================================================
              FINAL STATUS
          =================================================== */}

          <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">

            <div className="flex flex-wrap items-center justify-between gap-4">

              <div>

                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Application Status
                </div>

                <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                  {data.status ||
                    "Draft"}
                </h2>

                {data.submittedAt && (
                  <p className="mt-1 text-sm text-slate-500">
                    Submitted on{" "}
                    {formatDate(
                      data.submittedAt
                    )}
                  </p>
                )}

              </div>

              <span
                className={`rounded-full px-4 py-2 text-sm font-bold ${statusClass()}`}
              >
                {data.status ||
                  "Draft"}
              </span>

            </div>

          </section>

        </div>
      </div>
    </div>
  );
}