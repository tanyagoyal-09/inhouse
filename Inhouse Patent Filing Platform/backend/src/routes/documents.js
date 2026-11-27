const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const Document = require("../models/Document");
const Patent = require("../models/Patent");

const {
  protect,
  requireAdmin,
} = require("../middleware/auth");

const router = express.Router();

const documentsDirectory = path.join(
  process.cwd(),
  "uploads",
  "documents"
);

fs.mkdirSync(documentsDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, documentsDirectory),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, extension)
      .replace(/[^a-z0-9_-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "document";
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/plain",
    ]);
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = new Set([".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp", ".txt"]);
    if (!allowed.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return cb(new Error("Only PDF, DOC, DOCX, JPG, JPEG, PNG, WebP and TXT files are allowed."));
    }
    return cb(null, true);
  },
});

// ============================================================
// AUTHENTICATION
// ============================================================
//
// Every document route requires a valid JWT.
//
// ============================================================

router.use(protect);

// ============================================================
// HELPER — GET USER ID
// ============================================================

function getUserId(req) {
  return String(
    req.user?.id ||
      req.user?.userId ||
      ""
  );
}

// ============================================================
// HELPER — CHECK ADMIN
// ============================================================

function isAdmin(req) {
  const role = String(
    req.user?.role || ""
  )
    .trim()
    .toUpperCase();

  return (
    role === "ADMIN" ||
    role === "ADMINISTRATOR"
  );
}

// ============================================================
// HELPER — DELETE PHYSICAL FILE
// ============================================================

function deleteFile(filePath) {
  if (!filePath) {
    return;
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(
      "Document file deletion error:",
      error.message
    );
  }
}

// ============================================================
// UPLOAD DOCUMENT
// ============================================================
//
// POST /api/documents
// Form-data: document, name, documentType, patentId(optional)
//
// ============================================================

router.post("/", upload.single("document"), async (req, res) => {
  let uploadedPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Document file is required.",
      });
    }

    uploadedPath = req.file.path;

    const userId = getUserId(req);
    const patentId = String(req.body?.patentId || "").trim();
    const documentType = String(req.body?.documentType || "Other").trim();
    const requestedName = String(req.body?.name || "").trim();

    if (patentId) {
      const patent = await Patent.findById(patentId).lean();
      if (!patent) {
        deleteFile(uploadedPath);
        return res.status(404).json({ success: false, message: "Patent not found." });
      }

      const owner = String(patent.applicantId) === userId;
      if (!isAdmin(req) && !owner) {
        deleteFile(uploadedPath);
        return res.status(403).json({ success: false, message: "Access denied." });
      }
    }

    const allowedTypes = [
      "Patent Application",
      "Patent Report",
      "Patent PDF",
      "Other",
    ];
    const normalizedType = allowedTypes.includes(documentType) ? documentType : "Other";

    const title = requestedName || path.basename(req.file.originalname, path.extname(req.file.originalname));

    const document = await Document.create({
      title,
      name: title,
      originalName: req.file.originalname,
      extension: path.extname(req.file.originalname).toLowerCase(),
      documentType: normalizedType,
      patentId: patentId || undefined,
      applicantId: userId,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: "Generated",
      version: 1,
      generatedAt: new Date(),
      generatedBy: userId,
      generatedByName: req.user.name || "",
      generatedByEmail: req.user.email || "",
      description: `Uploaded document: ${req.file.originalname}`,
      adminReviewStatus: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully.",
      document,
    });
  } catch (error) {
    if (uploadedPath) deleteFile(uploadedPath);
    console.error("Document upload error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid patent ID." });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to upload document.",
    });
  }
});

// ============================================================
// GET ALL DOCUMENTS
// ============================================================
//
// GET /api/documents
//
// ADMIN:
//     Can see all documents.
//
// APPLICANT/FACULTY:
//     Can see documents belonging to their patents.
//
// ============================================================

router.get("/", async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user ID is missing.",
      });
    }

    let documents;

    if (isAdmin(req)) {
      documents = await Document.find({})
        .populate(
          "patentId",
          "title status applicantId"
        )
        .populate(
          "applicantId",
          "name email role"
        )
        .sort({
          createdAt: -1,
        })
        .lean();
    } else {
      documents = await Document.find({
        applicantId: userId,
      })
        .populate(
          "patentId",
          "title status"
        )
        .sort({
          createdAt: -1,
        })
        .lean();
    }

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error(
      "Get documents error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve documents.",
    });
  }
});

// ============================================================
// GET DOCUMENTS FOR ONE PATENT
// ============================================================
//
// GET /api/documents/patent/:patentId
//
// ADMIN:
//     Any patent.
//
// APPLICANT/FACULTY:
//     Their own patent only.
//
// ============================================================

router.get(
  "/patent/:patentId",
  async (req, res) => {
    try {
      const {
        patentId,
      } = req.params;

      const patent =
        await Patent.findById(
          patentId
        ).lean();

      if (!patent) {
        return res.status(404).json({
          success: false,
          message:
            "Patent not found.",
        });
      }

      const userId = getUserId(req);

      const owner =
        patent.applicantId &&
        String(
          patent.applicantId
        ) === userId;

      if (
        !isAdmin(req) &&
        !owner
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      const documents =
        await Document.find({
          patentId,
        })
          .sort({
            version: -1,
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,
        count: documents.length,
        documents,
      });
    } catch (error) {
      console.error(
        "Get patent documents error:",
        error
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid patent ID.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve patent documents.",
      });
    }
  }
);

// ============================================================
// GET SINGLE DOCUMENT
// ============================================================
//
// GET /api/documents/:id
//
// ADMIN:
//     Any document.
//
// OWNER:
//     Their own document.
//
// ============================================================

router.get(
  "/:id",
  async (req, res) => {
    try {
      const document =
        await Document.findById(
          req.params.id
        )
          .populate(
            "patentId",
            "title status applicantId"
          )
          .populate(
            "applicantId",
            "name email role"
          )
          .lean();

      if (!document) {
        return res.status(404).json({
          success: false,
          message:
            "Document not found.",
        });
      }

      const userId = getUserId(req);

      const owner =
        document.applicantId &&
        String(
          document.applicantId._id ||
            document.applicantId
        ) === userId;

      if (
        !isAdmin(req) &&
        !owner
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      return res.status(200).json({
        success: true,
        document,
      });
    } catch (error) {
      console.error(
        "Get document error:",
        error
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid document ID.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve document.",
      });
    }
  }
);

// ============================================================
// DOWNLOAD DOCUMENT
// ============================================================
//
// GET /api/documents/:id/download
//
// Sends the physical PDF file.
//
// ============================================================

router.get(
  "/:id/download",
  async (req, res) => {
    try {
      const document =
        await Document.findById(
          req.params.id
        ).lean();

      if (!document) {
        return res.status(404).json({
          success: false,
          message:
            "Document not found.",
        });
      }

      const userId = getUserId(req);

      const owner =
        document.applicantId &&
        String(
          document.applicantId
        ) === userId;

      if (
        !isAdmin(req) &&
        !owner
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      // --------------------------------------------------------
      // Check document status
      // --------------------------------------------------------

      if (
        document.status ===
        "Deleted"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "This document has been deleted.",
        });
      }

      // --------------------------------------------------------
      // Validate physical path
      // --------------------------------------------------------

      if (
        !document.filePath
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Document file path is not available.",
        });
      }

      const filePath =
        path.resolve(
          document.filePath
        );

      // --------------------------------------------------------
      // Check file exists
      // --------------------------------------------------------

      if (
        !fs.existsSync(
          filePath
        )
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Document file no longer exists on the server.",
        });
      }

      // --------------------------------------------------------
      // Filename
      // --------------------------------------------------------

      const fileName =
        document.fileName ||
        "Patent-Document.pdf";

      // --------------------------------------------------------
      // Send file
      // --------------------------------------------------------

      return res.download(
        filePath,
        fileName,
        (error) => {
          if (error) {
            console.error(
              "Document download error:",
              error
            );

            if (
              !res.headersSent
            ) {
              return res.status(
                500
              ).json({
                success: false,
                message:
                  "Unable to download document.",
              });
            }
          }
        }
      );
    } catch (error) {
      console.error(
        "Download document error:",
        error
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid document ID.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to download document.",
      });
    }
  }
);

// ============================================================
// DELETE DOCUMENT
// ============================================================
//
// DELETE /api/documents/:id
//
// ADMIN:
//     Can delete any document.
//
// OWNER:
//     Can delete their own document.
//
// ============================================================

router.delete(
  "/:id",
  async (req, res) => {
    try {
      const document =
        await Document.findById(
          req.params.id
        );

      if (!document) {
        return res.status(404).json({
          success: false,
          message:
            "Document not found.",
        });
      }

      const userId = getUserId(req);

      const owner =
        document.applicantId &&
        String(
          document.applicantId
        ) === userId;

      if (
        !isAdmin(req) &&
        !owner
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      // --------------------------------------------------------
      // Delete physical file
      // --------------------------------------------------------

      deleteFile(
        document.filePath
      );

      // --------------------------------------------------------
      // Delete database record
      // --------------------------------------------------------

      await Document.findByIdAndDelete(
        req.params.id
      );

      return res.status(200).json({
        success: true,
        message:
          "Document deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete document error:",
        error
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid document ID.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete document.",
      });
    }
  }
);

// ============================================================
// ADMIN — DELETE DOCUMENT
// ============================================================
//
// DELETE /api/documents/admin/:id
//
// Explicit administrator endpoint.
//
// ============================================================

router.delete(
  "/admin/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const document =
        await Document.findById(
          req.params.id
        );

      if (!document) {
        return res.status(404).json({
          success: false,
          message:
            "Document not found.",
        });
      }

      deleteFile(
        document.filePath
      );

      await Document.findByIdAndDelete(
        req.params.id
      );

      return res.status(200).json({
        success: true,
        message:
          "Document permanently deleted by administrator.",
      });
    } catch (error) {
      console.error(
        "Admin delete document error:",
        error
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid document ID.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete document.",
      });
    }
  }
);

// ============================================================
// ERROR HANDLER
// ============================================================

router.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Documents route error:",
      error
    );

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Document file is too large. Maximum size is 10 MB.",
        });
      }
      return res.status(400).json({
        success: false,
        message: error.message || "File upload failed.",
      });
    }

    if (error?.message?.includes("Only PDF")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (
      res.headersSent
    ) {
      return next(error);
    }

    return res.status(500).json({
      success: false,
      message:
        "An unexpected document error occurred.",
    });
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;