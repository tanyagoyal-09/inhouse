const mongoose = require("mongoose");

// ============================================================
// USER SCHEMA
// ============================================================

const userSchema = new mongoose.Schema(
  {
    // ========================================================
    // BASIC INFORMATION
    // ========================================================

    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [
        2,
        "Name must contain at least 2 characters.",
      ],
      maxlength: [
        100,
        "Name cannot exceed 100 characters.",
      ],
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,

      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address.",
      ],
    },

    department: {
      type: String,
      default: "",
      trim: true,
      maxlength: [150, "Department cannot exceed 150 characters."],
    },

    // ========================================================
    // PASSWORD
    // ========================================================

    password: {
      type: String,
      required: [true, "Password is required."],

      /*
       * Never return password automatically
       * from MongoDB queries.
       *
       * Login explicitly uses:
       *
       * .select("+password")
       */

      select: false,
    },

    // ========================================================
    // ROLE
    // ========================================================

    role: {
      type: String,

      enum: {
        values: [
          "APPLICANT",
          "FACULTY",
          "ADMIN",
        ],

        message:
          "Role must be APPLICANT, FACULTY or ADMIN.",
      },

      default: "APPLICANT",

      uppercase: true,

      index: true,
    },

    // ========================================================
    // ACCOUNT STATUS
    // ========================================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

userSchema.index({
  role: 1,
  createdAt: -1,
});

userSchema.index({
  isActive: 1,
  createdAt: -1,
});

// ============================================================
// EXPORT
// ============================================================

module.exports = mongoose.model(
  "User",
  userSchema
);