const Document = require("../models/Document");
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Patent = require("../models/Patent");
const { auth, role } = require("../middleware/auth");
const { generate } = require("../utils/pdf");

const router = express.Router();

// ============================================================
// UPLOAD DIRECTORY
// ============================================================

const uploadDirectory = path.join(
  process.cwd(),
  "uploads"
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

// ============================================================
// MULTER CONFIGURATION
// ============================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const uniqueName =
      `drawing-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    const allowedExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
    ];

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (
      !allowedTypes.includes(file.mimetype) ||
      !allowedExtensions.includes(extension)
    ) {
      return cb(
        new Error(
          "Only PNG, JPG, JPEG and WebP images are allowed."
        )
      );
    }

    cb(null, true);
  },
});

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(auth);

// ============================================================
// HELPER — DELETE FILE
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
      "Drawing file cleanup error:",
      error
    );
  }
}

// ============================================================
// GET ALL PATENTS
// ============================================================

router.get("/", async (req, res) => {
  try {
    const filter =
      req.user.role === "ADMIN"
        ? {}
        : {
            applicantId: req.user.id,
          };

    const patents = await Patent.find(filter)
      .sort({
        updatedAt: -1,
      })
      .lean();

    return res.json({
      success: true,
      patents,
    });
  } catch (error) {
    console.error(
      "Get patents error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load patents",
    });
  }
});

// ============================================================
// CREATE PATENT
// ============================================================

router.post(
  "/",
  role(
    "APPLICANT",
    "FACULTY"
  ),
  async (req, res) => {
    try {
      const patent =
        await Patent.create({
          ...req.body,

          applicantId:
            req.user.id,

          status:
            "Draft",

          history: [
            {
              status:
                "Draft",

              action:
                "Patent Application Created",

              comment:
                "Patent application draft was created.",

              performedBy:
                req.user.id,

              performedByName:
                req.user.name || "",

              performedByEmail:
                req.user.email || "",

              timestamp:
                new Date(),
            },
          ],
        });

      return res.status(201).json({
        success: true,
        patent,
      });
    } catch (error) {
      console.error(
        "Create patent error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }
  }
);

// ============================================================
// GET SINGLE PATENT
// ============================================================

router.get(
  "/:id",
  async (req, res) => {
    try {
      const patent =
        await Patent.findById(
          req.params.id
        ).lean();

      if (!patent) {
        return res.status(404).json({
          success: false,
          message:
            "Patent not found",
        });
      }

      if (
        req.user.role !== "ADMIN" &&
        patent.applicantId.toString() !==
          req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied",
        });
      }

      return res.json({
        success: true,
        patent,
      });
    } catch (error) {
      console.error(
        "Get patent error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load patent",
      });
    }
  }
);

// ============================================================
// UPDATE PATENT
// ============================================================

router.put(
  "/:id",
  async (req, res) => {
    try {
      const patent =
        await Patent.findById(
          req.params.id
        );

      if (!patent) {
        return res.status(404).json({
          success: false,
          message:
            "Patent not found",
        });
      }

      if (
        req.user.role !== "ADMIN" &&
        patent.applicantId.toString() !==
          req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied",
        });
      }

      Object.assign(
        patent,
        req.body
      );

      await patent.save();

      return res.json({
        success: true,
        patent,
      });
    } catch (error) {
      console.error(
        "Update patent error:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }
  }
);

// ============================================================
// SUBMIT / RESUBMIT PATENT
// ============================================================

router.post(
  "/:id/submit",
  role(
    "APPLICANT",
    "FACULTY"
  ),
  async (req, res) => {
    try {
      const patent =
        await Patent.findById(
          req.params.id
        );

      if (
        !patent ||
        patent.applicantId.toString() !==
          req.user.id
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Patent not found",
        });
      }

      const isResubmission =
        patent.status ===
        "Changes Requested";

      patent.status =
        "Under Review";

      patent.submittedAt =
        new Date();

      patent.completion =
        100;

      patent.history.push({
        status:
          "Under Review",

        action:
          isResubmission
            ? "Patent Application Resubmitted"
            : "Patent Application Submitted",

        comment:
          isResubmission
            ? "The requested changes were completed and the application was resubmitted for review."
            : "The patent application was submitted for administrator review.",

        performedBy:
          req.user.id,

        performedByName:
          req.user.name || "",

        performedByEmail:
          req.user.email || "",

        timestamp:
          new Date(),
      });

      if (isResubmission) {
        patent.reviewComment =
          "";

        patent.reviewDecision =
          "";

        patent.reviewedAt =
          null;

        patent.reviewerName =
          "";

        patent.reviewerEmail =
          "";
      }

      await patent.save();

      return res.json({
        success: true,
        patent,
      });
    } catch (error) {
      console.error(
        "Submit patent error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to submit patent",
      });
    }
  }
);
/*
/*
|---------------------------------------------------------------------------
| UPLOAD DRAWING
|---------------------------------------------------------------------------
*/

router.post(
  "/:id/drawings",
  role("APPLICANT", "FACULTY"),
  upload.single("image"),

  async (req, res) => {
    let uploadedFilePath = null;

    try {
      // ==========================================================
      // FIND PATENT
      // ==========================================================

      const patent =
        await Patent.findById(
          req.params.id
        );

      if (!patent) {
        return res.status(404).json({
          success: false,
          message: "Patent not found",
        });
      }

      // ==========================================================
      // OWNERSHIP CHECK
      // ==========================================================

      if (
        patent.applicantId.toString() !==
        req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // ==========================================================
      // FILE CHECK
      // ==========================================================

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Drawing image is required.",
        });
      }

      uploadedFilePath =
        req.file.path;

      // ==========================================================
      // FIGURE NUMBER
      // ==========================================================

      const requestedFigureNumber =
        Number(
          req.body.figureNumber
        );

      const figureNumber =
        Number.isInteger(
          requestedFigureNumber
        ) &&
        requestedFigureNumber > 0
          ? requestedFigureNumber
          : patent.drawings.length + 1;

      // ==========================================================
      // DESCRIPTION
      // ==========================================================

      const description =
        typeof req.body.description ===
        "string"
          ? req.body.description.trim()
          : "";

      // ==========================================================
      // REFERENCE NUMBERS
      // ==========================================================

      const referenceNumbers =
        typeof req.body.referenceNumbers ===
        "string"
          ? req.body.referenceNumbers.trim()
          : "";

      // ==========================================================
      // PUBLIC URL
      // ==========================================================

      const preview =
        `/uploads/${req.file.filename}`;

      // ==========================================================
      // CREATE DRAWING OBJECT
      // ==========================================================

      const drawing = {
        figureNumber,

        fileName:
          req.file.filename,

        description,

        referenceNumbers,

        preview,

        filePath:
          req.file.path,

        size:
          req.file.size,

        status:
          "valid",
      };

      // ==========================================================
      // SAVE DRAWING INTO PATENT
      // ==========================================================

      patent.drawings.push(
        drawing
      );

      await patent.save();

      // ==========================================================
      // GET SAVED DRAWING
      // ==========================================================

      const savedDrawing =
        patent.drawings[
          patent.drawings.length - 1
        ];

      // ==========================================================
      // RESPONSE
      // ==========================================================

      return res.status(201).json({
        success: true,

        message:
          "Drawing uploaded and saved successfully.",

        drawing:
          savedDrawing,

        patent,
      });

    } catch (error) {

      console.error(
        "Drawing upload error:",
        error
      );

      // ========================================================
      // CLEANUP FILE IF DATABASE SAVE FAILED
      // ========================================================

      if (
        uploadedFilePath &&
        fs.existsSync(
          uploadedFilePath
        )
      ) {
        try {
          fs.unlinkSync(
            uploadedFilePath
          );
        } catch (
          cleanupError
        ) {
          console.error(
            "Drawing cleanup error:",
            cleanupError
          );
        }
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to upload drawing.",
      });
    }
  }
);
// ============================================================
// GENERATE PATENT PDF
// ============================================================

router.post(
  "/:id/pdf",
  role("APPLICANT", "FACULTY", "ADMIN"),
  async (req, res) => {
    try {
      const patent = await Patent.findById(req.params.id).lean();

      if (!patent) {
        return res.status(404).json({
          success: false,
          message: "Patent not found.",
        });
      }

      // Applicants/faculty can download only their own patent.
      // Administrators can download any patent for review.
      const isAdmin = req.user.role === "ADMIN";
      const isOwner =
        patent.applicantId &&
        patent.applicantId.toString() === req.user.id;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      if (!String(patent.title || "").trim()) {
        return res.status(400).json({
          success: false,
          message: "Patent title is required before generating the PDF.",
        });
      }

      console.log(`Generating patent PDF: ${patent._id}`);

      const pdfBuffer = await generate(patent);

      if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
        throw new Error("Puppeteer returned an empty PDF.");
      }

      const safeTitle =
        String(patent.title)
          .trim()
          .replace(/[^a-z0-9]+/gi, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 80) || "Patent-Application";

      const fileName = `PatentFlow-${safeTitle}.pdf`;

      res.status(200);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);

      console.log(`Patent PDF generated successfully: ${fileName}`);

      return res.send(pdfBuffer);
    } catch (error) {
      console.error("Patent PDF generation error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to generate patent PDF.",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      });
    }
  }
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;