const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Patent = require("../models/Patent");

const {
  protect,
  requireAdmin,
} = require("../middleware/auth");

const router = express.Router();

/*
 * ============================================================
 * ADMIN ROUTES
 * ============================================================
 *
 * Every route in this file requires:
 *
 * 1. Valid JWT
 * 2. ADMIN role
 *
 * The middleware/auth.js file exports:
 *
 * protect
 * requireAdmin
 *
 * Therefore:
 *
 * router.use(protect);
 * router.use(requireAdmin);
 *
 * ============================================================
 */

router.use(protect);
router.use(requireAdmin);

/*
 * ============================================================
 * GET /api/admin/test
 * ============================================================
 *
 * Test administrator authentication.
 *
 * ============================================================
 */

router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message:
      "Administrator authentication is working.",
    user: req.user,
  });
});

/*
 * ============================================================
 * GET /api/admin/me
 * ============================================================
 *
 * Returns the currently authenticated administrator.
 *
 * ============================================================
 */

router.get("/me", async (req, res) => {
  try {
    const userId =
      req.user.id ||
      req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token.",
      });
    }

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Administrator account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name || "",
        email: user.email || "",
        role: user.role || "ADMIN",
      },
    });
  } catch (error) {
    console.error(
      "Admin profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve administrator information.",
    });
  }
});

/*
 * ============================================================
 * GET /api/admin/users
 * ============================================================
 *
 * Get all registered users.
 *
 * Passwords are never returned.
 *
 * ============================================================
 */

router.get("/users", async (req, res) => {
  try {
    const users =
      await User.find({})
        .select("-password")
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(
      "Get users error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve users.",
    });
  }
});

/*
 * ============================================================
 * GET /api/admin/patents
 * ============================================================
 *
 * Administrator can view all patent applications.
 *
 * ============================================================
 */

router.get(
  "/patents",
  async (req, res) => {
    try {
      const patents =
        await Patent.find({})
          .sort({
            createdAt: -1,
          })
          .populate(
            "applicantId",
            "name email role"
          )
          .lean();

      return res.status(200).json({
        success: true,
        count: patents.length,
        patents,
      });
    } catch (error) {
      console.error(
        "Get admin patents error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve patent applications.",
      });
    }
  }
);

/*
 * ============================================================
 * GET /api/admin/patents/:id
 * ============================================================
 *
 * Get one patent for the administrator review screen.
 *
 * ============================================================
 */

router.get(
  "/patents/:id",
  async (req, res) => {
    try {
      const patent = await Patent.findById(req.params.id)
        .populate("applicantId", "name email role")
        .lean();

      if (!patent) {
        return res.status(404).json({
          success: false,
          message: "Patent not found.",
        });
      }

      return res.status(200).json({
        success: true,
        patent,
      });
    } catch (error) {
      console.error("Get admin patent error:", error);

      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid patent ID.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Unable to retrieve patent.",
      });
    }
  }
);

/*
 * ============================================================
 * PATCH /api/admin/patents/:id/status
 * ============================================================
 */

router.patch(
  "/patents/:id/status",
  async (req, res) => {
    try {
      const allowedStatuses = [
        "Draft",
        "Submitted",
        "Under Review",
        "Changes Requested",
        "Approved",
        "Rejected",
      ];

      const status = String(req.body?.status || "").trim();
      const reviewComment = String(req.body?.reviewComment || "").trim();

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid patent status.",
        });
      }

      if ((status === "Changes Requested" || status === "Rejected") && !reviewComment) {
        return res.status(400).json({
          success: false,
          message: "A review comment is required for this decision.",
        });
      }

      const patent = await Patent.findById(req.params.id);

      if (!patent) {
        return res.status(404).json({
          success: false,
          message: "Patent not found.",
        });
      }

      patent.status = status;
      patent.reviewComment = reviewComment;
      patent.reviewDecision = [
        "Approved",
        "Changes Requested",
        "Rejected",
      ].includes(status) ? status : "";
      patent.reviewedAt = new Date();
      patent.reviewerName = req.user.name || "";
      patent.reviewerEmail = req.user.email || "";

      if (status === "Approved") {
        patent.completion = 100;
      }

      patent.history = patent.history || [];
      patent.history.push({
        status,
        action: `Patent Application ${status}`,
        comment: reviewComment,
        performedBy: req.user.id,
        performedByName: req.user.name || "",
        performedByEmail: req.user.email || "",
        timestamp: new Date(),
      });

      await patent.save();

      return res.status(200).json({
        success: true,
        message: "Patent status updated successfully.",
        patent,
      });
    } catch (error) {
      console.error("Update patent status error:", error);

      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid patent ID.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Unable to update patent status.",
      });
    }
  }
);

/*
 * ============================================================
 * GET /api/admin/documents
 * ============================================================
 */

router.get("/documents", async (req, res) => {
  try {
    const documents = await require("../models/Document")
      .find({})
      .populate("patentId", "title status applicantId")
      .populate("applicantId", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get admin documents error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve documents.",
    });
  }
});

/*
 * ============================================================
 * PATCH /api/admin/documents/:id/review
 * ============================================================
 */

router.patch("/documents/:id/review", async (req, res) => {
  try {
    const allowedStatuses = [
      "Pending",
      "Approved",
      "Changes Requested",
      "Rejected",
    ];

    const reviewStatus = String(req.body?.reviewStatus || "").trim();
    const reviewComment = String(req.body?.reviewComment || "").trim();

    if (!allowedStatuses.includes(reviewStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document review status.",
      });
    }

    if ((reviewStatus === "Changes Requested" || reviewStatus === "Rejected") && !reviewComment) {
      return res.status(400).json({
        success: false,
        message: "A review comment is required for this decision.",
      });
    }

    const Document = require("../models/Document");
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    document.adminReviewStatus = reviewStatus;
    document.adminReviewComment = reviewComment;
    document.adminReviewedAt = new Date();
    document.adminReviewerName = req.user.name || "";
    document.adminReviewerEmail = req.user.email || "";

    await document.save();

    const updated = await Document.findById(document._id)
      .populate("patentId", "title status applicantId")
      .populate("applicantId", "name email role")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Document review updated successfully.",
      document: updated,
    });
  } catch (error) {
    console.error("Update document review error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update document review.",
    });
  }
});

/*
 * ============================================================
 * GET /api/admin/dashboard
 * ============================================================
 *
 * Administrator dashboard statistics.
 *
 * Patent schema statuses:
 *
 * Draft
 * Under Review
 * Changes Requested
 * Approved
 * Submitted
 *
 * ============================================================
 */

router.get(
  "/dashboard",
  async (req, res) => {
    try {
      const [
        totalUsers,
        totalPatents,
        submittedPatents,
        underReviewPatents,
        approvedPatents,
        changesRequestedPatents,
        draftPatents,
      ] =
        await Promise.all([
          User.countDocuments({}),

          Patent.countDocuments({}),

          Patent.countDocuments({
            status: "Submitted",
          }),

          Patent.countDocuments({
            status: "Under Review",
          }),

          Patent.countDocuments({
            status: "Approved",
          }),

          Patent.countDocuments({
            status: "Changes Requested",
          }),

          Patent.countDocuments({
            status: "Draft",
          }),
        ]);

      return res.status(200).json({
        success: true,

        statistics: {
          totalUsers,
          totalPatents,
          submittedPatents,
          underReviewPatents,
          approvedPatents,
          changesRequestedPatents,
          draftPatents,
        },
      });
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load administrator dashboard.",
      });
    }
  }
);

/*
 * ============================================================
 * PUT /api/admin/users/:id/role
 * ============================================================
 *
 * Change a user's role.
 *
 * Body:
 *
 * {
 *   "role": "FACULTY"
 * }
 *
 * Allowed:
 *
 * APPLICANT
 * FACULTY
 * ADMIN
 *
 * ============================================================
 */

router.put(
  "/users/:id/role",
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({
          success: false,
          message:
            "Role is required.",
        });
      }

      const normalizedRole =
        String(role)
          .trim()
          .toUpperCase();

      const allowedRoles = [
        "APPLICANT",
        "FACULTY",
        "ADMIN",
      ];

      if (
        !allowedRoles.includes(
          normalizedRole
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid role. Allowed roles are APPLICANT, FACULTY and ADMIN.",
        });
      }

      /*
       * Prevent administrator from removing
       * their own administrator access.
       */

      const currentAdminId =
        String(
          req.user.id ||
          req.user.userId ||
          ""
        );

      if (
        String(id) ===
          currentAdminId &&
        normalizedRole !== "ADMIN"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot remove your own administrator access.",
        });
      }

      const user =
        await User.findByIdAndUpdate(
          id,
          {
            role: normalizedRole,
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "User role updated successfully.",

        user: {
          id: user._id,
          _id: user._id,
          name: user.name || "",
          email: user.email || "",
          role: user.role || "",
        },
      });
    } catch (error) {
      console.error(
        "Update user role error:",
        error
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to update user role.",
      });
    }
  }
);

/*
 * ============================================================
 * POST /api/admin/create-admin
 * ============================================================
 *
 * Create another administrator.
 *
 * Body:
 *
 * {
 *   "name": "Admin",
 *   "email": "admin2@example.com",
 *   "password": "password123"
 * }
 *
 * Only an authenticated administrator can
 * create another administrator.
 *
 * ============================================================
 */

router.post(
  "/create-admin",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
      } = req.body;

      /*
       * --------------------------------------------------------
       * Validate input
       * --------------------------------------------------------
       */

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email and password are required.",
        });
      }

      if (
        typeof name !== "string" ||
        name.trim().length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name must contain at least 2 characters.",
        });
      }

      if (
        String(password).length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 6 characters.",
        });
      }

      /*
       * --------------------------------------------------------
       * Normalize email
       * --------------------------------------------------------
       */

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(
          normalizedEmail
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid email address.",
        });
      }

      /*
       * --------------------------------------------------------
       * Check existing account
       * --------------------------------------------------------
       */

      const existingUser =
        await User.findOne({
          email:
            normalizedEmail,
        });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists.",
        });
      }

      /*
       * --------------------------------------------------------
       * Hash password
       * --------------------------------------------------------
       */

      const hashedPassword =
        await bcrypt.hash(
          String(password),
          12
        );

      /*
       * --------------------------------------------------------
       * Create administrator
       * --------------------------------------------------------
       */

      const adminUser =
        await User.create({
          name:
            String(name).trim(),

          email:
            normalizedEmail,

          password:
            hashedPassword,

          role:
            "ADMIN",

          isActive:
            true,
        });

      /*
       * --------------------------------------------------------
       * Safe response
       * --------------------------------------------------------
       */

      return res.status(201).json({
        success: true,
        message:
          "Administrator account created successfully.",

        user: {
          id: adminUser._id,
          _id: adminUser._id,
          name:
            adminUser.name,

          email:
            adminUser.email,

          role:
            adminUser.role,
        },
      });
    } catch (error) {
      console.error(
        "Create admin error:",
        error
      );

      if (
        error.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists.",
        });
      }

      if (
        error.name ===
        "ValidationError"
      ) {
        const messages =
          Object.values(
            error.errors || {}
          ).map(
            (item) =>
              item.message
          );

        return res.status(400).json({
          success: false,
          message:
            messages.join(", ") ||
            "Invalid administrator information.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to create administrator account.",
      });
    }
  }
);

/*
 * ============================================================
 * DELETE /api/admin/users/:id
 * ============================================================
 *
 * Delete a user account.
 *
 * Administrator cannot delete their own account.
 *
 * ============================================================
 */

router.delete(
  "/users/:id",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const currentAdminId =
        String(
          req.user.id ||
          req.user.userId ||
          ""
        );

      /*
       * --------------------------------------------------------
       * Prevent self deletion
       * --------------------------------------------------------
       */

      if (
        String(id) ===
        currentAdminId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot delete your own administrator account.",
        });
      }

      /*
       * --------------------------------------------------------
       * Find user
       * --------------------------------------------------------
       */

      const user =
        await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      /*
       * --------------------------------------------------------
       * Delete user
       * --------------------------------------------------------
       */

      await User.findByIdAndDelete(
        id
      );

      return res.status(200).json({
        success: true,
        message:
          "User deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete user error:",
        error
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete user.",
      });
    }
  }
);

/*
 * ============================================================
 * EXPORT ROUTER
 * ============================================================
 */

module.exports = router;