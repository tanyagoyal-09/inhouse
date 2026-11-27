const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Patent = require("../models/Patent");
const Document = require("../models/Document");
const { auth, requireRole } = require("../middleware/auth");
const { generate } = require("../utils/pdf");

const router = express.Router();

/*
 * ============================================================
 * UPLOAD DIRECTORY
 * ============================================================
 */

const uploadDirectory = path.join(
  process.cwd(),
  "uploads"
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

/*
 * ============================================================
 * MULTER CONFIGURATION
 * ============================================================
 *
 * Used for patent technical drawing uploads.
 *
 * Allowed:
 * PNG
 * JPG
 * JPEG
 * WEBP
 *
 * Maximum:
 * 5 MB per image
 *
 * ============================================================
 */

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

    return cb(null, true);
  },
});

/*
 * ============================================================
 * JWT AUTHENTICATION
 * ============================================================
 *
 * Every patent endpoint below requires authentication.
 *
 * The frontend must send:
 *
 * Authorization: Bearer <JWT_TOKEN>
 *
 * ============================================================
 */

router.use(auth);

/*
 * ============================================================
 * HELPER — DELETE FILE
 * ============================================================
 */

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
      error.message
    );
  }
}

/*
 * ============================================================
 * GET ALL PATENTS
 * ============================================================
 *
 * ADMIN:
 *     Can see all patents.
 *
 * APPLICANT/FACULTY:
 *     Can see their own patents.
 *
 * GET /api/patents
 * ============================================================
 */

router.get("/", async (req, res) => {
  try {
    const roleName = String(
      req.user.role || ""
    ).toUpperCase();

    const filter =
      roleName === "ADMIN"
        ? {}
        : {
            applicantId: req.user.id,
          };

    const patents = await Patent.find(
      filter
    )
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
        "Unable to load patents.",
    });
  }
});

/*
 * ============================================================
 * CREATE PATENT
 * ============================================================
 *
 * POST /api/patents
 *
 * Only:
 * APPLICANT
 * FACULTY
 *
 * can create a patent.
 *
 * ADMIN should review/manage patents rather than creating
 * applicant submissions through this endpoint.
 *
 * ============================================================
 */

router.post(
  "/",
  requireRole(
    "APPLICANT",
    "FACULTY"
  ),
  async (req, res) => {
    try {
      const patent =
        await Patent.create({
          ...req.body,

          /*
           * IMPORTANT:
           * Never trust applicantId sent by frontend.
           *
           * Always take it from verified JWT.
           */

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
        message:
          "Patent created successfully.",
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
          error.message ||
          "Unable to create patent.",
      });
    }
  }
);

/*
 * ============================================================
 * GET SINGLE PATENT
 * ============================================================
 *
 * GET /api/patents/:id
 *
 * ADMIN:
 *     Any patent.
 *
 * USER:
 *     Own patent only.
 *
 * ============================================================
 */

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
            "Patent not found.",
        });
      }

      const roleName = String(
        req.user.role || ""
      ).toUpperCase();

      const isAdmin =
        roleName === "ADMIN";

      const isOwner =
        patent.applicantId &&
        patent.applicantId.toString() ===
          req.user.id;

      if (
        !isAdmin &&
        !isOwner
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
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
          "Unable to load patent.",
      });
    }
  }
);

/*
 * ============================================================
 * UPDATE PATENT
 * ============================================================
 *
 * PUT /api/patents/:id
 *
 * ADMIN:
 *     Can update any patent.
 *
 * OWNER:
 *     Can update their own patent.
 *
 * ============================================================
 */

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
            "Patent not found.",
        });
      }

      const roleName = String(
        req.user.role || ""
      ).toUpperCase();

      const isAdmin =
        roleName === "ADMIN";

      const isOwner =
        patent.applicantId &&
        patent.applicantId.toString() ===
          req.user.id;

      if (
        !isAdmin &&
        !isOwner
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      /*
       * Prevent frontend from changing ownership.
       */

      const updateData = {
        ...req.body,
      };

      delete updateData.applicantId;
      delete updateData.history;

      /*
       * Regular users should not directly change review
       * information/status through this endpoint.
       *
       * Admin review endpoints should handle those changes.
       */

      if (!isAdmin) {
        delete updateData.status;
        delete updateData.reviewDecision;
        delete updateData.reviewComment;
        delete updateData.reviewedAt;
        delete updateData.reviewerName;
        delete updateData.reviewerEmail;
      }

      Object.assign(
        patent,
        updateData
      );

      await patent.save();

      return res.json({
        success: true,
        message:
          "Patent updated successfully.",
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
          error.message ||
          "Unable to update patent.",
      });
    }
  }
);

/*
 * ============================================================
 * SUBMIT / RESUBMIT PATENT
 * ============================================================
 *
 * POST /api/patents/:id/submit
 *
 * Only owner can submit.
 *
 * ============================================================
 */

router.post(
  "/:id/submit",
  requireRole(
    "APPLICANT",
    "FACULTY"
  ),
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
            "Patent not found.",
        });
      }

      if (
        !patent.applicantId ||
        patent.applicantId.toString() !==
          req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      const isResubmission =
        patent.status ===
        "Changes Requested";

      /*
       * Update submission status.
       */

      patent.status =
        "Under Review";

      patent.submittedAt =
        new Date();

      patent.completion =
        100;

      /*
       * Add history record.
       */

      patent.history =
        patent.history || [];

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

      /*
       * Clear previous review data on resubmission.
       */

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
        message:
          isResubmission
            ? "Patent resubmitted successfully."
            : "Patent submitted successfully.",
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
          "Unable to submit patent.",
      });
    }
  }
);

/*
 * ============================================================
 * UPLOAD TECHNICAL DRAWING
 * ============================================================
 *
 * POST /api/patents/:id/drawings
 *
 * Form-data:
 *
 * image              -> image file
 * figureNumber      -> optional
 * description       -> optional
 * referenceNumbers  -> optional
 *
 * ============================================================
 */

router.post(
  "/:id/drawings",
  requireRole(
    "APPLICANT",
    "FACULTY"
  ),
  upload.single("image"),

  async (req, res) => {
    let uploadedFilePath =
      null;

    try {
      /*
       * --------------------------------------------------------
       * Find patent
       * --------------------------------------------------------
       */

      const patent =
        await Patent.findById(
          req.params.id
        );

      if (!patent) {
        if (req.file) {
          deleteFile(
            req.file.path
          );
        }

        return res.status(404).json({
          success: false,
          message:
            "Patent not found.",
        });
      }

      /*
       * --------------------------------------------------------
       * Ownership
       * --------------------------------------------------------
       */

      if (
        !patent.applicantId ||
        patent.applicantId.toString() !==
          req.user.id
      ) {
        if (req.file) {
          deleteFile(
            req.file.path
          );
        }

        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      /*
       * --------------------------------------------------------
       * File check
       * --------------------------------------------------------
       */

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Drawing image is required.",
        });
      }

      uploadedFilePath =
        req.file.path;

      /*
       * --------------------------------------------------------
       * Figure number
       * --------------------------------------------------------
       */

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
          : (patent.drawings || []).length + 1;

      /*
       * --------------------------------------------------------
       * Description
       * --------------------------------------------------------
       */

      const description =
        typeof req.body.description ===
        "string"
          ? req.body.description.trim()
          : "";

      /*
       * --------------------------------------------------------
       * Reference numbers
       * --------------------------------------------------------
       */

      const referenceNumbers =
        typeof req.body.referenceNumbers ===
        "string"
          ? req.body.referenceNumbers.trim()
          : "";

      /*
       * --------------------------------------------------------
       * Preview URL
       * --------------------------------------------------------
       */

      const preview =
        `/uploads/${req.file.filename}`;

      /*
       * --------------------------------------------------------
       * Drawing object
       * --------------------------------------------------------
       */

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

      /*
       * --------------------------------------------------------
       * Ensure drawings array exists
       * --------------------------------------------------------
       */

      if (
        !Array.isArray(
          patent.drawings
        )
      ) {
        patent.drawings = [];
      }

      /*
       * --------------------------------------------------------
       * Save drawing
       * --------------------------------------------------------
       */

      patent.drawings.push(
        drawing
      );

      await patent.save();

      const savedDrawing =
        patent.drawings[
          patent.drawings.length - 1
        ];

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

      /*
       * Cleanup uploaded file if DB operation failed.
       */

      if (
        uploadedFilePath
      ) {
        deleteFile(
          uploadedFilePath
        );
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to upload drawing.",
      });
    }
  }
);

/*
 * ============================================================
 * GENERATE PATENT PDF
 * ============================================================
 *
 * POST /api/patents/:id/pdf
 *
 * JWT protected.
 *
 * APPLICANT/FACULTY:
 *     Can generate their own patent PDF.
 *
 * ADMIN:
 *     Can generate any patent PDF.
 *
 * ============================================================
 */

router.post(
  "/:id/pdf",
  requireRole(
    "APPLICANT",
    "FACULTY",
    "ADMIN"
  ),
  async (req, res) => {
    try {
      /*
       * --------------------------------------------------------
       * Find patent
       * --------------------------------------------------------
       */

      const patent =
        await Patent.findById(
          req.params.id
        ).lean();

      if (!patent) {
        return res.status(404).json({
          success: false,
          message:
            "Patent not found.",
        });
      }

      /*
       * --------------------------------------------------------
       * Authorization
       * --------------------------------------------------------
       */

      const roleName =
        String(
          req.user.role || ""
        ).toUpperCase();

      const isAdmin =
        roleName === "ADMIN";

      const isOwner =
        patent.applicantId &&
        patent.applicantId.toString() ===
          req.user.id;

      if (
        !isAdmin &&
        !isOwner
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      /*
       * --------------------------------------------------------
       * Validate title
       * --------------------------------------------------------
       */

      if (
        !String(
          patent.title || ""
        ).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Patent title is required before generating the PDF.",
        });
      }

      console.log(
        `Generating patent PDF: ${patent._id}`
      );

      /*
       * --------------------------------------------------------
       * Generate PDF using Puppeteer
       * --------------------------------------------------------
       */

      const pdfBuffer =
        await generate(
          patent
        );

      /*
       * --------------------------------------------------------
       * Validate PDF
       * --------------------------------------------------------
       */

      if (
        !Buffer.isBuffer(
          pdfBuffer
        ) ||
        pdfBuffer.length === 0
      ) {
        throw new Error(
          "Puppeteer returned an empty PDF."
        );
      }

      /*
       * Check PDF signature.
       */

      const signature =
        pdfBuffer
          .subarray(0, 5)
          .toString("ascii");

      if (
        signature !== "%PDF-"
      ) {
        throw new Error(
          "Generated file is not a valid PDF."
        );
      }

      /*
       * --------------------------------------------------------
       * Safe filename
       * --------------------------------------------------------
       */

      const safeTitle =
        String(
          patent.title
        )
          .trim()
          .replace(
            /[^a-z0-9]+/gi,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          )
          .slice(
            0,
            80
          ) ||
        "Patent-Application";

      const fileName =
        `Inhouse-Patent-Filing-System-${safeTitle}.pdf`;

      /*
       * --------------------------------------------------------
       * Persist generated PDF as a Document record.
       * --------------------------------------------------------
       *
       * The existing API still returns the PDF immediately, so
       * this does not change the download behaviour. It also
       * makes the Documents page aware of generated PDFs.
       */

      try {
        const documentsDirectory = path.join(
          process.cwd(),
          "uploads",
          "documents"
        );

        fs.mkdirSync(documentsDirectory, { recursive: true });

        const storedFileName =
          `${Date.now()}-${Math.round(Math.random() * 1e9)}-${fileName}`;

        const storedFilePath = path.join(
          documentsDirectory,
          storedFileName
        );

        fs.writeFileSync(storedFilePath, pdfBuffer);

        const lastDocument = await Document.findOne({
          patentId: patent._id,
        })
          .sort({ version: -1 })
          .select("version")
          .lean();

        const version =
          Number(lastDocument?.version || 0) + 1;

        await Document.create({
          title: patent.title,
          name: fileName,
          originalName: fileName,
          extension: ".pdf",
          documentType: "Patent PDF",
          patentId: patent._id,
          applicantId: patent.applicantId,
          fileName: storedFileName,
          filePath: storedFilePath,
          fileUrl: `/uploads/documents/${storedFileName}`,
          mimeType: "application/pdf",
          size: pdfBuffer.length,
          status: "Available",
          version,
          generatedAt: new Date(),
          generatedBy: req.user.id,
          generatedByName: req.user.name || "",
          generatedByEmail: req.user.email || "",
          description: `Generated patent PDF for ${patent.title}`,
          adminReviewStatus: "Pending",
        });

        await Patent.updateOne(
          { _id: patent._id },
          { $set: { reportGeneratedAt: new Date() } }
        );
      } catch (documentError) {
        // PDF generation/download remains successful even if the
        // optional document archive write fails.
        console.error(
          "Patent PDF archive error:",
          documentError
        );
      }

      /*
       * --------------------------------------------------------
       * Response headers
       * --------------------------------------------------------
       */

      res.status(200);

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );

      res.setHeader(
        "Content-Length",
        pdfBuffer.length
      );

      res.setHeader(
        "Cache-Control",
        "no-store"
      );

      console.log(
        `Patent PDF generated successfully: ${fileName}`
      );

      /*
       * --------------------------------------------------------
       * Send PDF
       * --------------------------------------------------------
       */

      return res.send(
        pdfBuffer
      );

    } catch (error) {
      console.error(
        "Patent PDF generation error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to generate patent PDF.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  }
);

/*
 * ============================================================
 * MULTER ERROR HANDLER
 * ============================================================
 *
 * Handles file-size and file-type errors cleanly.
 *
 * ============================================================
 */

router.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Drawing file is too large. Maximum size is 5 MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "File upload failed.",
      });
    }

    /*
     * File type validation error.
     */

    if (
      error &&
      error.message &&
      error.message.includes(
        "Only PNG"
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    return next(error);
  }
);

/*
 * ============================================================
 * EXPORT ROUTER
 * ============================================================
 */

module.exports =
  router;