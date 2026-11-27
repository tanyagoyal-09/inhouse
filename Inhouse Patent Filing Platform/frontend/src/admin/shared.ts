// Types and pure helpers shared by the administration pages.

// ============================================================
// TYPES
// ============================================================

export interface Drawing {
  figureNumber?: number;
  fileName?: string;
  description?: string;
  referenceNumbers?: string;
  preview?: string;
  filePath?: string;
  size?: number;
  status?: "valid" | "warning" | "invalid" | string;
}

export interface Claim {
  number?: number;
  type?: string;
  dependsOn?: string;
  text?: string;
}

export interface Applicant {
  _id?: string;
  name?: string;
  email?: string;
}

export interface AdminDocument {
  _id: string;
  name?: string;
  originalName?: string;
  fileName?: string;
  filePath?: string;
  mimeType?: string;
  extension?: string;
  size?: number;
  documentType?: string;
  status?: string;
  validationMessage?: string;
  patentId?:
    | string
    | {
        _id?: string;
        title?: string;
        status?: string;
        applicantName?: string;
        applicantEmail?: string;
      }
    | null;
  uploadedBy?:
    | string
    | {
        _id?: string;
        name?: string;
        email?: string;
        role?: string;
      }
    | null;
  createdAt?: string;
  updatedAt?: string;
  adminReviewStatus?:
    | "Pending"
    | "Approved"
    | "Changes Requested"
    | "Rejected"
    | string;
  adminReviewComment?: string;
  adminReviewedAt?: string;
  adminReviewerName?: string;
  adminReviewerEmail?: string;
}

export interface Patent {
  _id: string;

  title?: string;
  classification?: string;
  status?: string;
  completion?: number;

  applicantId?: string | Applicant;

  applicantName?: string;
  applicantEmail?: string;

  abstract?: string;
  field?: string;

  backgroundPriorArt?: string;
  backgroundProblems?: string;
  backgroundNeed?: string;

  summaryProblem?: string;
  summarySolution?: string;
  summaryComponents?: string;
  summaryOperation?: string;
  summaryAdvantages?: string;

  detailedOverview?: string;
  detailedArchitecture?: string;
  detailedOperation?: string;
  detailedImplementation?: string;
  detailedEmbodiments?: string;

  inventors?: string;

  guideName?: string;
  guideEmail?: string;

  keywords?: string;

  reviewComment?: string;
  reviewedAt?: string;

  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;

  drawings?: Drawing[];
  claims?: Claim[];
}

export type Status =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Changes Requested"
  | "Approved";

export type FilterStatus = "All" | Status;

// ============================================================
// STATUS OPTIONS
// ============================================================

export const STATUS_OPTIONS: Status[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Changes Requested",
  "Approved",
];

// ============================================================
// API BASE URL
// ============================================================

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://127.0.0.1:5000";

// ============================================================
// DRAWING URL HELPER
// ============================================================

export function getDrawingUrl(preview?: string) {
  if (!preview) {
    return "";
  }

  const value = String(preview).trim();

  if (!value) {
    return "";
  }

  // Already an absolute/browser URL
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  // Backend path such as:
  // /uploads/drawings/example.png
  if (value.startsWith("/")) {
    return `${API_BASE_URL}${value}`;
  }

  // Backend path such as:
  // uploads/drawings/example.png
  return `${API_BASE_URL}/${value}`;
}

// ============================================================
// STATUS HELPERS
// ============================================================

export function getStatusClass(status?: string) {
  switch (status) {
    case "Approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "Changes Requested":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "Under Review":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "Submitted":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "Draft":
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export function getStatusDot(status?: string) {
  switch (status) {
    case "Approved":
      return "bg-emerald-500";

    case "Changes Requested":
      return "bg-amber-500";

    case "Under Review":
      return "bg-blue-500";

    case "Submitted":
      return "bg-purple-500";

    default:
      return "bg-slate-400";
  }
}

// ============================================================
// APPLICANT HELPERS
// ============================================================

export function getApplicantName(patent: Patent) {
  if (patent.applicantName?.trim()) {
    return patent.applicantName;
  }

  if (
    patent.applicantId &&
    typeof patent.applicantId === "object" &&
    patent.applicantId.name?.trim()
  ) {
    return patent.applicantId.name;
  }

  return "Applicant";
}

export function getApplicantEmail(patent: Patent) {
  if (patent.applicantEmail?.trim()) {
    return patent.applicantEmail;
  }

  if (
    patent.applicantId &&
    typeof patent.applicantId === "object" &&
    patent.applicantId.email?.trim()
  ) {
    return patent.applicantId.email;
  }

  return "Email not available";
}

// ============================================================
// DATE FORMAT
// ============================================================

export function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============================================================
// DATE + TIME
// ============================================================

export function formatDateTime(value?: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// TRUNCATE
// ============================================================

export function truncate(text?: string, length = 180) {
  if (!text?.trim()) {
    return "No information provided.";
  }

  const cleanText = text.trim();

  if (cleanText.length <= length) {
    return cleanText;
  }

  return `${cleanText.slice(0, length)}...`;
}

// ============================================================
// COMPLETION
// ============================================================

export function getCompletion(value?: number) {
  const number = Number(value ?? 0);

  if (Number.isNaN(number)) {
    return 0;
  }

  return Math.min(100, Math.max(0, number));
}

// ============================================================
// MAIN COMPONENT
// ============================================================
