import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";

import api from "../services/api";
import {
  type AdminDocument,
  type FilterStatus,
  type Patent,
  type Status,
  STATUS_OPTIONS,
  API_BASE_URL,
  getApplicantName,
  getApplicantEmail,
  getCompletion,
} from "./shared";

/**
 * All state and actions of the administration console.
 *
 * It lives in a layout route that wraps every /admin/* page, so the loaded
 * applications, the search text and the status filter survive moving between
 * the Overview, Applications, Review and Document Review pages (and Back/Forward).
 */
function useAdminState() {
  // STATE
  // ==========================================================

  const [patents, setPatents] = useState<Patent[]>([]);

  const [documents, setDocuments] =
    useState<AdminDocument[]>([]);

  const [selectedPatent, setSelectedPatent] =
    useState<Patent | null>(null);

  const [search, setSearch] = useState("");

  const [filter, setFilter] =
    useState<FilterStatus>("All");

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [downloadingId, setDownloadingId] =
    useState<string | null>(null);

  const [reviewComment, setReviewComment] =
    useState("");

  const [updatingDocumentId, setUpdatingDocumentId] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ==========================================================
  // LOAD DOCUMENTS
  // ==========================================================

  const loadDocuments = async () => {
    try {
      const response = await api.get(
        "/admin/documents"
      );

      const data =
        response.data?.documents ?? [];

      setDocuments(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Failed to load admin documents:",
        err
      );

      /*
       * Keep patent loading independent. The document
       * review panel will show an empty state if this
       * endpoint is unavailable.
       */
    }
  };

  // ==========================================================
  // LOAD PATENTS
  // ==========================================================

  const loadPatents = async (
    showRefresh = false
  ) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/admin/patents");

      const data: Patent[] =
        response.data?.patents ?? [];

      setPatents(
        Array.isArray(data) ? data : []
      );

      if (selectedPatent) {
        const updatedPatent = data.find(
          (item) =>
            item._id === selectedPatent._id
        );

        if (updatedPatent) {
          setSelectedPatent(updatedPatent);

          setReviewComment(
            updatedPatent.reviewComment ?? ""
          );
        }
      }
    } catch (err) {
      console.error(
        "Failed to load patents:",
        err
      );

      setError(
        "Unable to load patent applications. Please check the backend connection."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadPatents();
    loadDocuments();
  }, []);

  // ==========================================================
  // AUTO CLEAR SUCCESS
  // ==========================================================

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  // ==========================================================
  // STATISTICS
  // ==========================================================

  const statistics = useMemo(() => {
    const total = patents.length;

    const pending = patents.filter(
      (patent) =>
        patent.status === "Submitted" ||
        patent.status === "Under Review"
    ).length;

    const changes = patents.filter(
      (patent) =>
        patent.status === "Changes Requested"
    ).length;

    const approved = patents.filter(
      (patent) =>
        patent.status === "Approved"
    ).length;

    const drafts = patents.filter(
      (patent) =>
        patent.status === "Draft"
    ).length;

    return {
      total,
      pending,
      changes,
      approved,
      drafts,
    };
  }, [patents]);

  // ==========================================================
  // SEARCH + FILTER
  // ==========================================================

  const filteredPatents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patents.filter((patent) => {
      const searchableText = [
        patent.title,
        patent.classification,
        getApplicantName(patent),
        getApplicantEmail(patent),
        patent.abstract,
        patent.keywords,
        patent.inventors,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchableText.includes(query);

      const matchesFilter =
        filter === "All" ||
        patent.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [patents, search, filter]);

  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  const updateStatus = async (
    patent: Patent,
    status: Status
  ) => {
    const comment = reviewComment.trim();

    if (
      status === "Changes Requested" &&
      !comment
    ) {
      setError(
        "Please write a review comment explaining what needs to be changed."
      );

      return;
    }

    try {
      setUpdatingId(patent._id);

      setError("");
      setSuccess("");

      const response = await api.patch(
        `/admin/patents/${patent._id}/status`,
        {
          status,
          reviewComment: comment,
        }
      );

      const updatedPatent: Patent =
        response.data?.patent ?? {
          ...patent,
          status,
          reviewComment: comment,
          reviewedAt:
            new Date().toISOString(),
          updatedAt:
            new Date().toISOString(),
        };

      setPatents((current) =>
        current.map((item) =>
          item._id === patent._id
            ? {
                ...item,
                ...updatedPatent,
              }
            : item
        )
      );

      setSelectedPatent((current) =>
        current?._id === patent._id
          ? {
              ...current,
              ...updatedPatent,
            }
          : current
      );

      setReviewComment(
        updatedPatent.reviewComment ?? ""
      );

      setSuccess(
        `Application ${status.toLowerCase()} successfully.`
      );
    } catch (err) {
      console.error(
        "Status update failed:",
        err
      );

      setError(
        "Could not update the application status. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // ==========================================================
  // UPDATE DOCUMENT REVIEW
  // ==========================================================

  const updateDocumentReview = async (
    document: AdminDocument,
    reviewStatus:
      | "Pending"
      | "Approved"
      | "Changes Requested"
      | "Rejected"
  ) => {
    const comment =
      (document.adminReviewComment || "").trim();

    if (
      (reviewStatus === "Changes Requested" ||
        reviewStatus === "Rejected") &&
      !comment
    ) {
      setError(
        "Please write a review comment for this document decision."
      );
      return;
    }

    try {
      setUpdatingDocumentId(
        document._id
      );
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/admin/documents/${document._id}/review`,
        {
          reviewStatus,
          reviewComment: comment,
        }
      );

      const updatedDocument =
        response.data?.document;

      if (updatedDocument) {
        setDocuments((current) =>
          current.map((item) =>
            item._id === document._id
              ? updatedDocument
              : item
          )
        );
      }

      setSuccess(
        `Document ${reviewStatus.toLowerCase()} successfully.`
      );
    } catch (err: any) {
      console.error(
        "Document review update failed:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Could not update document review."
      );
    } finally {
      setUpdatingDocumentId(null);
    }
  };

  // ==========================================================
  // OPEN / DOWNLOAD DOCUMENT
  // ==========================================================

  const openAdminDocument = async (
    document: AdminDocument
  ) => {
    try {
      setError("");

      const response = await api.get(
        `/documents/${document._id}/download`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        {
          type:
            document.mimeType ||
            "application/octet-stream",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const newWindow =
        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );

      if (!newWindow) {
        window.URL.revokeObjectURL(url);
        setError(
          "Unable to open the document. Please allow pop-ups for this application."
        );
        return;
      }

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 60000);
    } catch (err: any) {
      console.error(
        "Open admin document failed:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to open document."
      );
    }
  };

  // ==========================================================
  // DOWNLOAD PDF
  // ==========================================================

  const downloadPDF = async (
    patent: Patent
  ) => {
    try {
      setDownloadingId(patent._id);
      setError("");

      const response = await api.post(
        `/patents/${patent._id}/pdf`,
        {},
        {
          responseType: "blob",
        }
      );

      if (!response.data) {
        throw new Error(
          "Empty PDF response"
        );
      }

      const blob = new Blob(
        [response.data],
        {
          type: "application/pdf",
        }
      );

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      const safeTitle =
        patent.title
          ?.replace(
            /[^a-z0-9]+/gi,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          )
          .slice(0, 80) ||
        "Patent-Application";

      link.download =
        `Inhouse-Patent-Filing-System-${safeTitle}.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      setSuccess(
        "Patent PDF generated successfully."
      );
    } catch (err) {
      console.error(
        "PDF download failed:",
        err
      );

      setError(
        "Unable to generate/download the patent PDF."
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================


  // ==========================================================
  // REVIEW (route /admin/patents/:patentId)
  // ==========================================================

  /** Load one application for the review page. `fallback` is used if the detail call fails. */
  const loadReview = async (id: string, fallback?: Patent | null) => {
    try {
      setError("");
      setSuccess("");

      const response = await api.get(`/admin/patents/${id}`);
      const selected: Patent | null = response.data?.patent ?? fallback ?? null;

      setSelectedPatent(selected);
      setReviewComment(selected?.reviewComment ?? "");
      return selected !== null;
    } catch (err) {
      console.error("Failed to open patent:", err);

      if (fallback) {
        setSelectedPatent(fallback);
        setReviewComment(fallback.reviewComment ?? "");
        return true;
      }

      setSelectedPatent(null);
      return false;
    }
  };

  const clearReview = () => {
    setSelectedPatent(null);
    setReviewComment("");
    setError("");
    setSuccess("");
  };

  return {
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
    clearReview
  };
}

type AdminContextValue = ReturnType<typeof useAdminState>;

const AdminContext = createContext<AdminContextValue | null>(null);

/** Layout route element: provides admin state to all nested /admin pages. */
export function AdminProvider() {
  const value = useAdminState();
  return (
    <AdminContext.Provider value={value}>
      <Outlet />
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}
