// ============================================================
// USER ROLES
// ============================================================

export type Role =
  | "APPLICANT"
  | "FACULTY"
  | "ADMIN";

// ============================================================
// APPLICATION PAGES
// ============================================================

// ============================================================
// PATENT STATUS
// ============================================================

export type PatentStatus =
  | "Draft"
  | "Under Review"
  | "Changes Requested"
  | "Approved"
  | "Submitted";

// ============================================================
// PATENT
// ============================================================
export interface Patent {
  _id: string;
  id?: string;

  title: string;
  applicant: string;
  classification: string;
  updatedAt: string;

  status: PatentStatus;
  completion: number;
  reviewComment?: string;
reviewDecision?: string;
reviewedAt?: string;
reviewerName?: string;
reviewerEmail?: string;
reportGeneratedAt?: string;
}

// ============================================================
// DRAWING
// ============================================================

export interface DrawingItem {
  id: string;
  figureNumber: number;
  fileName: string;
  description: string;
  referenceNumbers: string;
  preview: string;
  size: number;
  status: "valid" | "warning" | "invalid";
}

// ============================================================
// COMPONENT
// ============================================================

export interface ComponentItem {
  id: string;
  referenceNumber: string;
  name: string;
  description: string;
}

// ============================================================
// CLAIM
// ============================================================

export interface ClaimItem {
  id: string;
  number: number;
  type: "Independent" | "Dependent";
  dependsOn: string;
  text: string;
}

// ============================================================
// PATENT FORM DATA
// ============================================================

export interface PatentFormData {
  title: string;

  // Field
  field: string;

  // Background
  backgroundPriorArt: string;
  backgroundProblems: string;
  backgroundNeed: string;

  // Summary
  summaryProblem: string;
  summarySolution: string;
  summaryComponents: string;
  summaryOperation: string;
  summaryAdvantages: string;

  // Detailed Description
  detailedOverview: string;
  detailedArchitecture: string;
  detailedOperation: string;
  detailedImplementation: string;
  detailedEmbodiments: string;

  // Abstract
  abstract: string;

  // Applicant
  applicantName: string;
  applicantEmail: string;
  applicantDepartment: string;

  // Inventors
  inventors: string;

  // Guide
  guideName: string;
  guideEmail: string;

  // Classification
  classification: string;
  keywords: string;

  // Drawings
  drawings: DrawingItem[];

  // Components
  components: ComponentItem[];

  // Claims
  claims: ClaimItem[];
}

// ============================================================
// UPLOADED IMAGE
// ============================================================

export interface UploadedImage {
  id: string;
  name: string;
  size: number;
  status: "valid" | "warning" | "invalid";
  preview: string;
}