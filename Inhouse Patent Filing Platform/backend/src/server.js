const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();

const db = require("./config/db");

const auth = require("./routes/auth");
const patents = require("./routes/patents");
const admin = require("./routes/admin");
const documentRoutes = require("./routes/documents");

const app = express();

const PORT = process.env.PORT || 5000;

/*
 * ============================================================
 * DIRECTORIES
 * ============================================================
 */

const uploadsDirectory = path.join(
  process.cwd(),
  "uploads"
);

const documentsDirectory = path.join(
  uploadsDirectory,
  "documents"
);

fs.mkdirSync(
  uploadsDirectory,
  {
    recursive: true,
  }
);

fs.mkdirSync(
  documentsDirectory,
  {
    recursive: true,
  }
);

/*
 * ============================================================
 * CORS
 * ============================================================
 */

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

/*
 * Add frontend URL from .env if available.
 */

if (
  process.env.FRONTEND_URL &&
  !allowedOrigins.includes(
    process.env.FRONTEND_URL
  )
) {
  allowedOrigins.push(
    process.env.FRONTEND_URL
  );
}

app.use(
  cors({
    origin: (
      origin,
      callback
    ) => {
      /*
       * Allow requests without an Origin.
       *
       * This allows:
       * - Postman
       * - curl
       * - server-to-server requests
       */

      if (!origin) {
        return callback(
          null,
          true
        );
      }

      /*
       * Allow known frontend origins.
       */

      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      console.log(
        "CORS blocked origin:",
        origin
      );

      return callback(
        new Error(
          "Not allowed by CORS"
        )
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    exposedHeaders: [
      "Content-Disposition",
    ],

    credentials: true,
  })
);

/*
 * ============================================================
 * BODY PARSERS
 * ============================================================
 */

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

/*
 * ============================================================
 * STATIC UPLOADS
 * ============================================================
 *
 * Patent drawings/previews can be accessed from:
 *
 * /uploads/...
 *
 * Protected documents should continue to use:
 *
 * /api/documents/:id/download
 *
 * ============================================================
 */

app.use(
  "/uploads",
  express.static(
    uploadsDirectory
  )
);

/*
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */

app.get(
  "/api/health",
  (
    req,
    res
  ) => {
    return res.status(200).json({
      success: true,
      service: "Inhouse Patent Filing System API",
      status: "running",
    });
  }
);

/*
 * ============================================================
 * AUTHENTICATION ROUTES
 * ============================================================
 *
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/admin-login
 * GET  /api/auth/me
 * GET  /api/auth/verify
 *
 * JWT is handled inside:
 *
 * backend/src/routes/auth.js
 *
 * ============================================================
 */

app.use(
  "/api/auth",
  auth
);

/*
 * ============================================================
 * PATENT ROUTES
 * ============================================================
 */

app.use(
  "/api/patents",
  patents
);

/*
 * ============================================================
 * ADMIN ROUTES
 * ============================================================
 */

app.use(
  "/api/admin",
  admin
);

/*
 * ============================================================
 * DOCUMENT ROUTES
 * ============================================================
 */

app.use(
  "/api/documents",
  documentRoutes
);

/*
 * ============================================================
 * API 404 HANDLER
 * ============================================================
 */

app.use(
  (
    req,
    res
  ) => {
    return res.status(404).json({
      success: false,
      message:
        "API endpoint not found.",
      path:
        req.originalUrl,
    });
  }
);

/*
 * ============================================================
 * GLOBAL ERROR HANDLER
 * ============================================================
 */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Server error:",
      error
    );

    /*
     * CORS error
     */

    if (
      error &&
      error.message &&
      error.message.includes(
        "CORS"
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Request blocked by CORS policy.",
      });
    }

    /*
     * Generic server error
     */

    return res.status(
      error.status ||
        500
    ).json({
      success: false,
      message:
        error.message ||
        "Internal server error.",
    });
  }
);

/*
 * ============================================================
 * START SERVER
 * ============================================================
 */

async function startServer() {
  try {
    /*
     * Connect MongoDB first.
     */

    await db();

    /*
     * Start Express server.
     */

    app.listen(
      PORT,
      "127.0.0.1",
      () => {
        console.log("");

        console.log(
          "=========================================="
        );

        console.log(
          "   INHOUSE PATENT FILING SYSTEM - BACKEND API"
        );

        console.log(
          "=========================================="
        );

        console.log(
          `API: http://127.0.0.1:${PORT}`
        );

        console.log(
          `Health: http://127.0.0.1:${PORT}/api/health`
        );

        console.log(
          `Auth: http://127.0.0.1:${PORT}/api/auth`
        );

        console.log(
          `Patents: http://127.0.0.1:${PORT}/api/patents`
        );

        console.log(
          `Admin: http://127.0.0.1:${PORT}/api/admin`
        );

        console.log(
          `Documents: http://127.0.0.1:${PORT}/api/documents`
        );

        console.log(
          "=========================================="
        );

        console.log("");
      }
    );
  } catch (error) {
    console.error(
      "Database connection failed:",
      error
    );

    process.exit(1);
  }
}

/*
 * ============================================================
 * START
 * ============================================================
 */

startServer();

/*
 * ============================================================
 * EXPORT
 * ============================================================
 */

module.exports = app;