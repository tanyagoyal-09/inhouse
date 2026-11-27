import { useEffect, useState } from "react";
import api from "../services/api";

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

interface Patent {
  _id: string;
  title: string;
  status:
    | "Draft"
    | "Submitted"
    | "Under Review"
    | "Changes Requested"
    | "Approved";
  completion?: number;
  submittedAt?: string;
  reviewedAt?: string;
  reviewComment?: string;
  reviewDecision?: string;
  reviewerName?: string;
  reviewerEmail?: string;
  reportGeneratedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  history?: PatentHistory[];
}

/*
|--------------------------------------------------------------------------
| STATUS PROGRESS
|--------------------------------------------------------------------------
*/

const statusOrder = [
  "Draft",
  "Under Review",
  "Approved",
] as const;

function getStatusIndex(status: Patent["status"]) {
  if (status === "Approved") return 2;
  if (status === "Under Review") return 1;
  if (status === "Changes Requested") return 1;

  return 0;
}

/*
|--------------------------------------------------------------------------
| DATE FORMATTER
|--------------------------------------------------------------------------
*/

function formatDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString();
}

/*
|--------------------------------------------------------------------------
| STATUS DESCRIPTION
|--------------------------------------------------------------------------
*/

function getStatusDescription(
  status: Patent["status"]
) {
  switch (status) {
    case "Draft":
      return "Your patent application is still being prepared.";

    case "Under Review":
      return "Your patent application has been submitted and is currently under administrator review.";

    case "Changes Requested":
      return "The administrator has requested changes to your patent application.";

    case "Approved":
      return "Your patent application has been approved.";

    case "Submitted":
      return "Your patent application has been submitted.";

    default:
      return "Current application status.";
  }
}

/*
|--------------------------------------------------------------------------
| STATUS BADGE CLASS
|--------------------------------------------------------------------------
*/

function getStatusClass(
  status: Patent["status"]
) {
  switch (status) {
    case "Approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "Changes Requested":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "Under Review":
    case "Submitted":
      return "bg-blue-50 text-blue-700 border-blue-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

/*
|--------------------------------------------------------------------------
| HISTORY EVENT CLASS
|--------------------------------------------------------------------------
*/

function getHistoryEventClass(
  status: PatentHistory["status"]
) {
  switch (status) {
    case "Approved":
      return {
        dot: "border-emerald-200 bg-emerald-500",
        box: "border-emerald-200 bg-emerald-50",
        title: "text-emerald-800",
        text: "text-emerald-700",
      };

    case "Changes Requested":
      return {
        dot: "border-amber-200 bg-amber-500",
        box: "border-amber-200 bg-amber-50",
        title: "text-amber-800",
        text: "text-amber-700",
      };

    case "Under Review":
    case "Submitted":
      return {
        dot: "border-blue-200 bg-blue-500",
        box: "border-blue-200 bg-blue-50",
        title: "text-blue-800",
        text: "text-blue-700",
      };

    default:
      return {
        dot: "border-slate-200 bg-slate-500",
        box: "border-slate-200 bg-slate-50",
        title: "text-slate-800",
        text: "text-slate-600",
      };
  }
}

/*
|--------------------------------------------------------------------------
| APPLICATION PROGRESS TIMELINE
|--------------------------------------------------------------------------
*/

function StatusTimeline({
  status,
}: {
  status: Patent["status"];
}) {
  const currentIndex = getStatusIndex(status);

  return (
    <div className="mt-6">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
        Application Progress
      </h3>

      <div className="relative">
        <div className="absolute left-4 top-4 hidden h-0.5 w-[calc(100%-32px)] bg-slate-200 sm:block" />

        <div className="relative grid gap-5 sm:grid-cols-3">
          {statusOrder.map((step, index) => {
            const completed =
              index <= currentIndex;

            return (
              <div
                key={step}
                className="flex items-center gap-3 sm:block sm:text-center"
              >
                <div
                  className={[
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold sm:mx-auto",
                    completed
                      ? "border-brand bg-brand text-white"
                      : "border-slate-200 bg-white text-slate-500",
                  ].join(" ")}
                >
                  {index + 1}
                </div>

                <div className="sm:mt-2">
                  <div
                    className={
                      completed
                        ? "text-sm font-bold text-brand"
                        : "text-sm font-medium text-slate-500"
                    }
                  >
                    {step}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {status === "Changes Requested" && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="font-bold text-amber-800">
            Changes Requested
          </div>

          <p className="mt-1 text-sm text-amber-700">
            Your application requires changes before it
            can be approved.
          </p>
        </div>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| PATENT HISTORY TIMELINE
|--------------------------------------------------------------------------
*/

function HistoryTimeline({
  history,
}: {
  history?: PatentHistory[];
}) {
  if (!history || history.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-line bg-slate-50 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Submission History
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          No application history is available yet.
        </p>
      </div>
    );
  }

  /*
   * Old records are shown first so the user can
   * understand the complete application journey.
   */
  const sortedHistory = [...history].sort(
    (a, b) => {
      const first = a.timestamp
        ? new Date(a.timestamp).getTime()
        : 0;

      const second = b.timestamp
        ? new Date(b.timestamp).getTime()
        : 0;

      return first - second;
    }
  );

  return (
    <div className="mt-6">
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Submission History
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          Complete record of important application
          events and review decisions.
        </p>
      </div>

      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute bottom-5 left-[15px] top-5 w-0.5 bg-slate-200" />

        <div className="space-y-5">
          {sortedHistory.map(
            (event, index) => {
              const styles =
                getHistoryEventClass(
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

                  {/* Event content */}
                  <div
                    className={[
                      "min-w-0 flex-1 rounded-xl border p-4",
                      styles.box,
                    ].join(" ")}
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                      <div>
                        <h4
                          className={[
                            "text-sm font-bold",
                            styles.title,
                          ].join(" ")}
                        >
                          {event.action}
                        </h4>

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {event.status}
                        </p>
                      </div>

                      <div className="shrink-0 text-xs text-slate-500">
                        {formatDate(
                          event.timestamp
                        )}
                      </div>
                    </div>

                    {event.comment?.trim() && (
                      <p
                        className={[
                          "mt-3 whitespace-pre-wrap text-sm leading-6",
                          styles.text,
                        ].join(" ")}
                      >
                        {event.comment}
                      </p>
                    )}

                    {event.performedByName && (
                      <div className="mt-3 border-t border-black/5 pt-3 text-xs text-slate-500">
                        <span className="font-semibold">
                          Performed by:
                        </span>{" "}
                        {event.performedByName}

                        {event.performedByEmail && (
                          <>
                            {" "}
                            ({event.performedByEmail})
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
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| TRACKING PAGE
|--------------------------------------------------------------------------
*/

export function Tracking() {
  const [patents, setPatents] =
    useState<Patent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * Load applicant patents
   */
  const loadPatents = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/patents");

      setPatents(
        response.data?.patents || []
      );
    } catch (err: any) {
      console.error(
        "Tracking load error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load patent tracking information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatents();
  }, []);

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/* HEADER */}
      {/* ---------------------------------------------------------------- */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Tracking
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Track the review and approval progress
            of your patent applications.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPatents}
          disabled={loading}
          className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-brand transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* ERROR */}
      {/* ---------------------------------------------------------------- */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* LOADING */}
      {/* ---------------------------------------------------------------- */}

      {loading && (
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-8 text-center text-sm text-slate-500">
          Loading application tracking...
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* EMPTY */}
      {/* ---------------------------------------------------------------- */}

      {!loading &&
        !error &&
        patents.length === 0 && (
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-10 text-center">
            <h2 className="text-lg font-bold text-brand">
              No patent applications found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Create a patent application to
              start tracking its progress.
            </p>
          </div>
        )}

      {/* ---------------------------------------------------------------- */}
      {/* PATENT CARDS */}
      {/* ---------------------------------------------------------------- */}

      {!loading &&
        patents.map((patent) => {
          const completion = Math.min(
            100,
            Math.max(
              0,
              patent.completion ?? 0
            )
          );

          return (
            <div
              key={patent._id}
              className="rounded-2xl border border-line bg-white p-5 shadow-sm"
            >
              {/* -------------------------------------------------------- */}
              {/* PATENT HEADER */}
              {/* -------------------------------------------------------- */}

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-xl font-bold text-brand">
                    {patent.title ||
                      "Untitled Patent"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Last updated:{" "}
                    {formatDate(
                      patent.updatedAt
                    )}
                  </p>
                </div>

                <span
                  className={[
                    "w-fit rounded-full border px-3 py-1 text-xs font-bold",
                    getStatusClass(
                      patent.status
                    ),
                  ].join(" ")}
                >
                  {patent.status}
                </span>
              </div>

              {/* -------------------------------------------------------- */}
              {/* STATUS DESCRIPTION */}
              {/* -------------------------------------------------------- */}

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-600">
                  {getStatusDescription(
                    patent.status
                  )}
                </p>
              </div>

              {/* -------------------------------------------------------- */}
              {/* COMPLETION */}
              {/* -------------------------------------------------------- */}

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">
                    Completion
                  </span>

                  <span className="text-sm font-bold text-brand">
                    {completion}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-500"
                    style={{
                      width: `${completion}%`,
                    }}
                  />
                </div>
              </div>

              {/* -------------------------------------------------------- */}
              {/* APPLICATION PROGRESS */}
              {/* -------------------------------------------------------- */}

              <StatusTimeline
                status={patent.status}
              />

              {/* -------------------------------------------------------- */}
              {/* SUBMISSION INFORMATION */}
              {/* -------------------------------------------------------- */}

              <div className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Submitted
                  </div>

                  <div className="mt-1 text-sm font-semibold text-slate-700">
                    {formatDate(
                      patent.submittedAt
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Reviewed
                  </div>

                  <div className="mt-1 text-sm font-semibold text-slate-700">
                    {formatDate(
                      patent.reviewedAt
                    )}
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------- */}
              {/* SUBMISSION HISTORY */}
              {/* -------------------------------------------------------- */}

              <HistoryTimeline
                history={patent.history}
              />

              {/* -------------------------------------------------------- */}
              {/* ADMINISTRATOR REVIEW */}
              {/* -------------------------------------------------------- */}

              {patent.reviewComment?.trim() && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="text-sm font-bold text-amber-800">
                    Administrator Review
                  </div>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">
                    {patent.reviewComment}
                  </p>

                  {patent.reviewerName && (
                    <p className="mt-2 text-xs text-amber-700">
                      Reviewed by{" "}
                      {patent.reviewerName}
                    </p>
                  )}

                  {patent.reviewerEmail && (
                    <p className="mt-1 text-xs text-amber-700">
                      {patent.reviewerEmail}
                    </p>
                  )}

                  {patent.reviewedAt && (
                    <p className="mt-2 text-xs text-amber-700">
                      Reviewed on{" "}
                      {formatDate(
                        patent.reviewedAt
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* REVIEW DECISION */}
              {/* -------------------------------------------------------- */}

              {patent.reviewDecision && (
                <div className="mt-5 rounded-xl border border-line bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Review Decision
                  </div>

                  <div className="mt-1 text-sm font-bold text-brand">
                    {patent.reviewDecision}
                  </div>

                  {patent.reportGeneratedAt && (
                    <p className="mt-1 text-xs text-slate-500">
                      Report updated:{" "}
                      {formatDate(
                        patent.reportGeneratedAt
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* CHANGES REQUESTED */}
              {/* -------------------------------------------------------- */}

              {patent.status ===
                "Changes Requested" && (
                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="font-bold text-amber-800">
                    Action Required
                  </div>

                  <p className="mt-1 text-sm leading-6 text-amber-700">
                    Please review the administrator
                    comments, make the requested
                    changes, and resubmit your
                    application.
                  </p>
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* APPROVED */}
              {/* -------------------------------------------------------- */}

              {patent.status ===
                "Approved" && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="font-bold text-emerald-800">
                    Patent Approved
                  </div>

                  <p className="mt-1 text-sm text-emerald-700">
                    Your patent application has
                    successfully passed the
                    administrator review.
                  </p>

                  {patent.reviewerName && (
                    <p className="mt-2 text-xs text-emerald-700">
                      Approved by{" "}
                      {patent.reviewerName}
                    </p>
                  )}

                  {patent.reviewedAt && (
                    <p className="mt-1 text-xs text-emerald-700">
                      Approved on{" "}
                      {formatDate(
                        patent.reviewedAt
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}