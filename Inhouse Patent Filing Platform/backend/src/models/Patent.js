const mongoose = require("mongoose");

// ============================================================
// DRAWING SCHEMA
// ============================================================

const drawingSchema = new mongoose.Schema(
  {
    figureNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    referenceNumbers: {
      type: String,
      default: "",
      trim: true,
    },

    // Browser-accessible URL
    // Example:
    // /uploads/drawing-123456.png
    preview: {
      type: String,
      required: true,
      trim: true,
    },

    // Physical path used by Puppeteer when
    // embedding drawings into the generated PDF.
    filePath: {
      type: String,
      default: "",
      trim: true,
    },

    size: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "valid",
        "warning",
        "invalid",
      ],
      default: "valid",
    },
  },
  {
    _id: false,
  }
);

// ============================================================
// COMPONENT SCHEMA
// ============================================================

const componentSchema = new mongoose.Schema(
  {
    referenceNumber: {
      type: String,
      default: "",
      trim: true,
    },

    name: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// ============================================================
// CLAIM SCHEMA
// ============================================================

const claimSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      min: 1,
    },

    type: {
      type: String,
      enum: [
        "Independent",
        "Dependent",
      ],
      default: "Independent",
    },

    dependsOn: {
      type: String,
      default: "",
      trim: true,
    },

    text: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

// ============================================================
// HISTORY SCHEMA
// ============================================================

const historySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "Draft",
        "Submitted",
        "Under Review",
        "Changes Requested",
        "Approved",
        "Rejected",
      ],
      required: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
    },

    comment: {
      type: String,
      default: "",
      trim: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    performedByName: {
      type: String,
      default: "",
      trim: true,
    },

    performedByEmail: {
      type: String,
      default: "",
      trim: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

// ============================================================
// PATENT SCHEMA
// ============================================================

const patentSchema = new mongoose.Schema(
  {
    // ========================================================
    // BASIC INFORMATION
    // ========================================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    field: {
      type: String,
      default: "",
      trim: true,
    },

    patentType: {
      type: String,
      default: "",
      trim: true,
    },

    // ========================================================
    // ABSTRACT
    // ========================================================

    abstract: {
      type: String,
      default: "",
    },

    // ========================================================
    // BACKGROUND
    // ========================================================

    backgroundPriorArt: {
      type: String,
      default: "",
    },

    backgroundProblems: {
      type: String,
      default: "",
    },

    backgroundNeed: {
      type: String,
      default: "",
    },

    // ========================================================
    // SUMMARY
    // ========================================================

    summaryProblem: {
      type: String,
      default: "",
    },

    summarySolution: {
      type: String,
      default: "",
    },

    summaryComponents: {
      type: String,
      default: "",
    },

    summaryOperation: {
      type: String,
      default: "",
    },

    summaryAdvantages: {
      type: String,
      default: "",
    },

    // ========================================================
    // DETAILED DESCRIPTION
    // ========================================================

    detailedOverview: {
      type: String,
      default: "",
    },

    detailedArchitecture: {
      type: String,
      default: "",
    },

    detailedOperation: {
      type: String,
      default: "",
    },

    detailedImplementation: {
      type: String,
      default: "",
    },

    detailedEmbodiments: {
      type: String,
      default: "",
    },

    // ========================================================
    // APPLICANT INFORMATION
    // ========================================================

    applicantName: {
      type: String,
      default: "",
      trim: true,
    },

    applicantEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    applicantDepartment: {
      type: String,
      default: "",
      trim: true,
    },

    // ========================================================
    // INVENTOR INFORMATION
    // ========================================================

    inventors: {
      type: String,
      default: "",
      trim: true,
    },

    // ========================================================
    // GUIDE INFORMATION
    // ========================================================

    guideName: {
      type: String,
      default: "",
      trim: true,
    },

    guideEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    // ========================================================
    // CLASSIFICATION
    // ========================================================

    classification: {
      type: String,
      default: "",
      trim: true,
    },

    keywords: {
      type: String,
      default: "",
      trim: true,
    },

    // ========================================================
    // COMPONENTS
    // ========================================================

    components: {
      type: [componentSchema],
      default: [],
    },

    // ========================================================
    // CLAIMS
    // ========================================================

    claims: {
      type: [claimSchema],
      default: [],
    },

    // ========================================================
    // TECHNICAL DRAWINGS
    // ========================================================

    drawings: {
      type: [drawingSchema],
      default: [],
    },

    // ========================================================
    // OWNER
    // ========================================================

    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================================
    // STATUS
    // ========================================================

    status: {
      type: String,
      enum: [
        "Draft",
        "Under Review",
        "Changes Requested",
        "Approved",
        "Submitted",
        "Rejected",
      ],
      default: "Draft",
      index: true,
    },

    // ========================================================
    // COMPLETION
    // ========================================================

    completion: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // ========================================================
    // SUBMISSION
    // ========================================================

    submittedAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // ADMIN REVIEW
    // ========================================================

    reviewComment: {
      type: String,
      default: "",
      trim: true,
    },

    reviewDecision: {
      type: String,
      enum: [
        "",
        "Approved",
        "Changes Requested",
        "Rejected",
      ],
      default: "",
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewerName: {
      type: String,
      default: "",
      trim: true,
    },

    reviewerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    // ========================================================
    // PDF / DOCUMENT
    // ========================================================

    reportGeneratedAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // APPLICATION HISTORY
    // ========================================================

    history: {
      type: [historySchema],
      default: [],
    },
  },

  // ==========================================================
  // TIMESTAMPS
  // ==========================================================

  {
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// ============================================================

patentSchema.index({
  applicantId: 1,
  updatedAt: -1,
});

patentSchema.index({
  status: 1,
  updatedAt: -1,
});

// ============================================================
// EXPORT
// ============================================================

module.exports =
  mongoose.models.Patent ||
  mongoose.model(
    "Patent",
    patentSchema
  );