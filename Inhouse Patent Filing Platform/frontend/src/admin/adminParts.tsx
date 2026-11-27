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

export function RefreshButton() {
  const { refreshing, loadPatents, loadDocuments } = useAdmin();
  return (
    <button
      type="button"
      onClick={async () => {
        await loadPatents(true);
        await loadDocuments();
      }}
      disabled={refreshing}
      className="btn-secondary"
    >
      {refreshing ? "Refreshing..." : "Refresh"}
    </button>
  );
}

export function AdminAlerts() {
  const { error, success } = useAdmin();
  if (!error && !success) return null;
  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}
    </div>
  );
}

