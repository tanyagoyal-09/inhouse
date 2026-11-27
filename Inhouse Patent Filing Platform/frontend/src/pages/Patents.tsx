import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import type { Patent } from "../types";

export function Patents() {
  const [patents, setPatents] =
    useState<Patent[]>([]);

  // The search term lives in the URL (?q=) so results survive refresh,
  // Back/Forward and bookmarks, and can be set from the header search box.
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const setSearch = (value: string) =>
    setSearchParams(value ? { q: value } : {}, { replace: true });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * ==========================================================
   * LOAD MY PATENTS
   * ==========================================================
   */

  useEffect(() => {
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
          "Load patents error:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "Unable to load your patents."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPatents();
  }, []);

  /*
   * ==========================================================
   * SEARCH
   * ==========================================================
   */

  const filteredPatents =
    patents.filter((patent) =>
      String(
        patent.title || ""
      )
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  /*
   * ==========================================================
   * EDITABLE STATUS
   * ==========================================================
   *
   * Draft:
   * User can continue editing.
   *
   * Changes Requested:
   * Administrator requested changes.
   * User can edit and resubmit.
   */

  const canEdit = (
    status: string
  ) => {
    return (
      status === "Draft" ||
      status === "Changes Requested"
    );
  };

  /*
   * ==========================================================
   * STATUS STYLE
   * ==========================================================
   */

  const getStatusClass = (
    status: string
  ) => {
    switch (status) {
      case "Draft":
        return "bg-slate-100 text-slate-700";

      case "Changes Requested":
        return "bg-amber-100 text-amber-700";

      case "Under Review":
        return "bg-blue-100 text-blue-700";

      case "Approved":
        return "bg-green-100 text-green-700";

      case "Submitted":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  /*
   * ==========================================================
   * ACTION BUTTON TEXT
   * ==========================================================
   */

  const getEditButtonText = (
    status: string
  ) => {
    if (
      status ===
      "Changes Requested"
    ) {
      return "Edit & Resubmit";
    }

    return "Edit Draft";
  };

  return (
    <div className="space-y-6">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          My Patents
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View, continue and manage your patent
          applications.
        </p>
      </div>

      {/* ======================================================
          SEARCH
          ====================================================== */}

      <input
        className="field max-w-xl"
        type="search"
        aria-label="Search patents"
        placeholder="Search patents..."
        value={search}
        onChange={(event) =>
          setSearch(
            event.target.value
          )
        }
      />

      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* ======================================================
          LOADING
          ====================================================== */}

      {loading && (
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-8 text-center text-sm font-semibold text-slate-500">
          Loading your patents...
        </div>
      )}

      {/* ======================================================
          EMPTY
          ====================================================== */}

      {!loading &&
        filteredPatents.length === 0 && (
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-8 text-center">

            <h2 className="text-xl font-extrabold text-brand">
              No patents found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "No patent matches your search."
                : "You have not created any patent applications yet."}
            </p>

          </div>
        )}

      {/* ======================================================
          PATENT LIST
          ====================================================== */}

      {!loading &&
        filteredPatents.length > 0 && (
          <div className="space-y-4">

            {filteredPatents.map(
              (patent) => {

                const editable =
                  canEdit(
                    patent.status
                  );

                const changesRequested =
                  patent.status ===
                  "Changes Requested";

                return (
                  <div
                    key={patent._id}
                    className={[
                      "rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md",
                      changesRequested
                        ? "border-amber-300"
                        : "border-line",
                    ].join(" ")}
                  >

                    {/* ==================================================
                        TOP
                        ================================================== */}

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0 flex-1">

                        <h2 className="break-words text-lg font-extrabold text-brand">
                          {patent.title ||
                            "Untitled Patent"}
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                          Last updated:{" "}
                          {patent.updatedAt
                            ? new Date(
                                patent.updatedAt
                              ).toLocaleString(
                                "en-IN"
                              )
                            : "N/A"}
                        </p>

                      </div>

                      {/* STATUS */}

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                          patent.status
                        )}`}
                      >
                        {patent.status}
                      </span>

                    </div>

                    {/* ==================================================
                        CHANGES REQUESTED NOTICE
                        ================================================== */}

                    {changesRequested && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">

                        <div className="font-extrabold text-amber-900">
                          Changes Required
                        </div>

                        <p className="mt-1 text-sm leading-6 text-amber-800">
                          The administrator has requested changes to this patent application. Open the application, review the administrator comments, make the required changes, and resubmit it for review.
                        </p>

                        {patent.reviewComment && (
                          <div className="mt-3 rounded-lg border border-amber-200 bg-white p-3">

                            <div className="text-xs font-bold uppercase tracking-wide text-amber-700">
                              Administrator Comment
                            </div>

                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-900">
                              {
                                patent.reviewComment
                              }
                            </p>

                          </div>
                        )}

                      </div>
                    )}

                    {/* ==================================================
                        PROGRESS
                        ================================================== */}

                    <div className="mt-5">

                      <div className="mb-2 flex items-center justify-between">

                        <span className="text-sm font-bold text-slate-700">
                          Completion
                        </span>

                        <span className="text-sm font-bold text-brand">
                          {patent.completion || 0}%
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full bg-brand transition-all"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                patent.completion || 0,
                                0
                              ),
                              100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* ==================================================
                        DETAILS
                        ================================================== */}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">

                      <div className="rounded-xl bg-slate-50 p-3">

                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Classification
                        </div>

                        <div className="mt-1 text-sm font-semibold text-slate-700">
                          {patent.classification ||
                            "Not specified"}
                        </div>

                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">

                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Application Status
                        </div>

                        <div className="mt-1 text-sm font-semibold text-slate-700">
                          {patent.status}
                        </div>

                      </div>

                    </div>

                    {/* ==================================================
                        ACTIONS
                        ================================================== */}

                    <div className="mt-5 flex flex-wrap gap-3">

                      {/* VIEW */}

                      <Link
                        to={`/patents/${patent._id}`}
                        state={{ patent }}
                        className="btn-secondary"
                      >
                        View Details
                      </Link>

                      {/* EDIT / RESUBMIT */}

                      {editable && (
                        <Link
                          to={`/patents/${patent._id}/edit`}
                          className={[
                            "btn text-white hover:opacity-90",
                            changesRequested
                              ? "bg-amber-600"
                              : "bg-brand",
                          ].join(" ")}
                        >
                          {getEditButtonText(
                            patent.status
                          )}
                        </Link>
                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

    </div>
  );
}