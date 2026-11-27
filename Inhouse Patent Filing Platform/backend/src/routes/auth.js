const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

/*
 * ============================================================
 * JWT CONFIGURATION
 * ============================================================
 */

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN || "7d";

/*
 * ============================================================
 * GENERATE JWT
 * ============================================================
 */

function generateToken(user) {
  if (!JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is missing from backend/.env"
    );
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name || "",
      email: user.email || "",
      role: String(user.role || "APPLICANT").toUpperCase(),
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

/*
 * ============================================================
 * SAFE USER RESPONSE
 * ============================================================
 *
 * Never send password/password hash to frontend.
 */

function safeUser(user) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name || "",
    email: user.email || "",
    role: String(
      user.role || "APPLICANT"
    ).toUpperCase(),
    isActive:
      user.isActive !== false,
  };
}

/*
 * ============================================================
 * AUTH TEST
 * ============================================================
 */

router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message:
      "Authentication routes are working.",
  });
});

/*
 * ============================================================
 * REGISTER
 * ============================================================
 *
 * POST /api/auth/register
 *
 * Public registration always creates APPLICANT.
 */

router.post(
  "/register",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
      } = req.body || {};

      /*
       * --------------------------------------------------------
       * Validate name
       * --------------------------------------------------------
       */

      if (
        !name ||
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name is required.",
        });
      }

      /*
       * --------------------------------------------------------
       * Validate email
       * --------------------------------------------------------
       */

      if (
        !email ||
        typeof email !== "string" ||
        !email.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email is required.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

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
       * Validate password
       * --------------------------------------------------------
       */

      if (
        !password ||
        typeof password !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password is required.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 6 characters.",
        });
      }

      /*
       * --------------------------------------------------------
       * Public registration can NEVER create ADMIN.
       * --------------------------------------------------------
       */

      const accountRole =
        "APPLICANT";

      /*
       * --------------------------------------------------------
       * Check existing account
       * --------------------------------------------------------
       */

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
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
          password,
          12
        );

      /*
       * --------------------------------------------------------
       * Create applicant
       * --------------------------------------------------------
       */

      const user =
        await User.create({
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: accountRole,
          isActive: true,
        });

      /*
       * --------------------------------------------------------
       * Generate JWT
       * --------------------------------------------------------
       */

      const token =
        generateToken(user);

      return res.status(201).json({
        success: true,
        message:
          "Account created successfully.",
        token,
        user: safeUser(user),
      });

    } catch (error) {
      console.error(
        "Registration error:",
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
            "Invalid account information.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to create account.",
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
 * NORMAL USER LOGIN
 * ============================================================
 *
 * POST /api/auth/login
 * ============================================================
 */

router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body || {};

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required.",
        });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      /*
       * Explicitly include password because
       * User schema has select:false.
       */

      const user =
        await User.findOne({
          email: normalizedEmail,
        }).select("+password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password.",
        });
      }

      /*
       * --------------------------------------------------------
       * Check account status
       * --------------------------------------------------------
       */

      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          message:
            "Your account has been deactivated.",
        });
      }

      /*
       * --------------------------------------------------------
       * ADMIN cannot use normal login
       * --------------------------------------------------------
       */

      const userRole =
        String(
          user.role || ""
        )
          .trim()
          .toUpperCase();

      if (
        userRole === "ADMIN" ||
        userRole === "ADMINISTRATOR"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Administrators must use the administrator login.",
        });
      }

      /*
       * --------------------------------------------------------
       * Validate stored password
       * --------------------------------------------------------
       */

      if (
        !user.password ||
        typeof user.password !== "string"
      ) {
        console.error(
          "User has no valid password hash:",
          user.email
        );

        return res.status(500).json({
          success: false,
          message:
            "This account does not have a valid password.",
        });
      }

      /*
       * --------------------------------------------------------
       * Compare password using bcrypt
       * --------------------------------------------------------
       */

      const passwordMatches =
        await bcrypt.compare(
          String(password),
          user.password
        );

      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password.",
        });
      }

      /*
       * --------------------------------------------------------
       * Generate JWT
       * --------------------------------------------------------
       */

      const token =
        generateToken(user);

      return res.status(200).json({
        success: true,
        message:
          "Login successful.",
        token,
        user: safeUser(user),
      });

    } catch (error) {
      console.error(
        "USER LOGIN ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to login.",
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
 * ADMIN LOGIN
 * ============================================================
 *
 * POST /api/auth/admin-login
 *
 * ONLY ADMIN accounts can login here.
 * ============================================================
 */

router.post(
  "/admin-login",
  async (req, res) => {
    try {
      console.log(
        "=========================================="
      );

      console.log(
        "ADMIN LOGIN REQUEST"
      );

      const {
        email,
        password,
      } = req.body || {};

      /*
       * --------------------------------------------------------
       * Validate request
       * --------------------------------------------------------
       */

      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Admin email and password are required.",
        });
      }

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();

      console.log(
        "Admin email:",
        normalizedEmail
      );

      /*
       * --------------------------------------------------------
       * Check JWT configuration
       * --------------------------------------------------------
       */

      if (!process.env.JWT_SECRET) {
        console.error(
          "JWT_SECRET is missing."
        );

        return res.status(500).json({
          success: false,
          message:
            "JWT_SECRET is not configured.",
        });
      }

      /*
       * --------------------------------------------------------
       * Find administrator
       *
       * password is select:false in User schema,
       * therefore explicitly select it.
       * --------------------------------------------------------
       */

      const user =
        await User.findOne({
          email: normalizedEmail,
        }).select("+password");

      /*
       * --------------------------------------------------------
       * User not found
       * --------------------------------------------------------
       */

      if (!user) {
        console.log(
          "Admin account not found."
        );

        return res.status(401).json({
          success: false,
          message:
            "Invalid administrator credentials.",
        });
      }

      console.log(
        "Admin account found:",
        user.email
      );

      /*
       * --------------------------------------------------------
       * Account status
       * --------------------------------------------------------
       */

      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          message:
            "Administrator account is deactivated.",
        });
      }

      /*
       * --------------------------------------------------------
       * Check role
       * --------------------------------------------------------
       */

      const userRole =
        String(
          user.role || ""
        )
          .trim()
          .toUpperCase();

      console.log(
        "Admin role:",
        userRole
      );

      if (
        userRole !== "ADMIN" &&
        userRole !== "ADMINISTRATOR"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "This account is not authorized for administrator access.",
        });
      }

      /*
       * --------------------------------------------------------
       * Validate password hash
       * --------------------------------------------------------
       */

      if (
        !user.password ||
        typeof user.password !== "string"
      ) {
        console.error(
          "Administrator has no valid password hash."
        );

        return res.status(500).json({
          success: false,
          message:
            "Administrator account has an invalid password.",
        });
      }

      /*
       * --------------------------------------------------------
       * bcrypt password comparison
       * --------------------------------------------------------
       */

      console.log(
        "Checking administrator password..."
      );

      const passwordMatches =
        await bcrypt.compare(
          String(password),
          user.password
        );

      if (!passwordMatches) {
        console.log(
          "Administrator password is incorrect."
        );

        return res.status(401).json({
          success: false,
          message:
            "Invalid administrator credentials.",
        });
      }

      console.log(
        "Administrator password verified."
      );

      /*
       * --------------------------------------------------------
       * Generate JWT
       * --------------------------------------------------------
       */

      console.log(
        "Generating administrator JWT..."
      );

      const token =
        generateToken(user);

      console.log(
        "Administrator JWT generated successfully."
      );

      console.log(
        "=========================================="
      );

      /*
       * --------------------------------------------------------
       * SUCCESS
       * --------------------------------------------------------
       */

      return res.status(200).json({
        success: true,
        message:
          "Administrator login successful.",
        token,
        user: safeUser(user),
      });

    } catch (error) {
      console.error(
        "=========================================="
      );

      console.error(
        "ADMIN LOGIN ERROR:"
      );

      console.error(
        error
      );

      console.error(
        "Error name:",
        error.name
      );

      console.error(
        "Error message:",
        error.message
      );

      console.error(
        "=========================================="
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to login as administrator.",
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
 * CURRENT USER
 * ============================================================
 *
 * GET /api/auth/me
 * ============================================================
 */

router.get(
  "/me",
  protect,
  async (req, res) => {
    try {
      const userId =
        req.user?.id ||
        req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid authentication token.",
        });
      }

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User account no longer exists.",
        });
      }

      return res.status(200).json({
        success: true,
        user: safeUser(user),
      });

    } catch (error) {
      console.error(
        "Get current user error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve user information.",
      });
    }
  }
);

/*
 * ============================================================
 * VERIFY JWT
 * ============================================================
 *
 * GET /api/auth/verify
 * ============================================================
 */

router.get(
  "/verify",
  protect,
  (req, res) => {
    return res.status(200).json({
      success: true,
      authenticated: true,
      user: req.user,
    });
  }
);

/*
 * ============================================================
 * LOGOUT
 * ============================================================
 *
 * JWT is stateless.
 * Frontend removes the token.
 * ============================================================
 */

router.post(
  "/logout",
  protect,
  (req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "Logged out successfully.",
    });
  }
);

/*
 * ============================================================
 * EXPORT
 * ============================================================
 */

module.exports = router;