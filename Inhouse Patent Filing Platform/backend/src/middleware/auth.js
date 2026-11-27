const jwt = require("jsonwebtoken");
const User = require("../models/User");

/*
 * Verify a JWT and attach the authenticated user payload to req.user.
 * Expected header: Authorization: Bearer <token>
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from backend/.env");
      return res.status(500).json({
        success: false,
        message: "Server authentication configuration is missing.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // Confirm the account still exists and is active.
    // This makes deactivation/deletion take effect immediately.
    const user = await User.findById(userId)
      .select("name email role isActive")
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists. Please log in again.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated.",
      });
    }

    req.user = {
      id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name || "",
      email: user.email || "",
      role: String(user.role || "APPLICANT").toUpperCase(),
    };

    return next();
  } catch (error) {
    console.error("JWT authentication error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token. Please log in again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

const auth = protect;

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const role = String(req.user.role || "")
    .trim()
    .toUpperCase();

  if (role !== "ADMIN" && role !== "ADMINISTRATOR") {
    return res.status(403).json({
      success: false,
      message: "Administrator access required.",
    });
  }

  return next();
};

const requireRole = (...allowedRoles) => {
  const normalizedRoles = allowedRoles.map((role) =>
    String(role).trim().toUpperCase()
  );

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const userRole = String(req.user.role || "")
      .trim()
      .toUpperCase();

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource.",
      });
    }

    return next();
  };
};

const requireUserId = (req, res, next) => {
  const userId = req.user?.id || req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authenticated user ID is missing.",
    });
  }

  return next();
};

module.exports = {
  auth,
  protect,
  requireAdmin,
  requireRole,
  requireUserId,
};
