
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

fs.mkdirSync(uploadsDirectory, {
  recursive: true,
});

fs.mkdirSync(documentsDirectory, {
  recursive: true,
});

/*
 * ============================================================
 * CORS CONFIGURATION
 * ============================================================
 */

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://inhouse-frontend-lxbu.onrender.com",
];

// Allow an additional frontend URL from environment variables.
if (
  process.env.FRONTEND_URL &&
  !allowedOrigins.includes(process.env.FRONTEND_URL)
) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin (Postman, curl, etc.).
      if (!origin) {
        return callback(null, true);
      }

      // Allow only approved frontend origins.
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("CORS blocked origin:", origin);

      return callback(new Error("Not allowed by CORS"));
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
 */

app.use(
  "/uploads",
  express.static(uploadsDirectory)
);

/*
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "Inhouse Patent Filing System API",
    status: "running",
  });
});

/*
 * ============================================================
 * AUTHENTICATION ROUTES
 * ============================================================
 */

app.use("/api/auth", auth);

/*
 * ============================================================
 * PATENT ROUTES
 * ============================================================
 */

app.use("/api/patents", patents);

/*
 * ============================================================
 * ADMIN ROUTES
 * ============================================================
 */

app.use("/api/admin", admin);

/*
 * ============================================================
 * DOCUMENT ROUTES
 * ============================================================
 */

app.use("/api/documents", documentRoutes);

/*
 * ============================================================
 * API 404 HANDLER
 * ============================================================
 */

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API endpoint not found.",
    path: req.originalUrl,
  });
});

/*
 * ============================================================
 * GLOBAL ERROR HANDLER
 * ============================================================
 */

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (
    error &&
    error.message &&
    error.message.includes("CORS")
  ) {
    return res.status(403).json({
      success: false,
      message: "Request blocked by CORS policy.",
    });
  }

  return res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error.",
  });
});

/*
 * ============================================================
 * START SERVER
 * ============================================================
 */

async function startServer() {
  try {
    // Connect MongoDB before accepting requests.
    await db();

    console.log("MongoDB connected successfully.");

    // Start Express only once.
    app.listen(PORT, "0.0.0.0", () => {
      console.log("");
      console.log("==========================================");
      console.log("   INHOUSE PATENT FILING SYSTEM");
      console.log("==========================================");

      console.log(`Backend running on port ${PORT}`);
      console.log(`Health: /api/health`);
      console.log(`Auth: /api/auth`);
      console.log(`Patents: /api/patents`);
      console.log(`Admin: /api/admin`);
      console.log(`Documents: /api/documents`);

      console.log("==========================================");
      console.log("");
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

startServer();

/*
 * ============================================================
 * EXPORT
 * ============================================================
 */

module.exports = app;
