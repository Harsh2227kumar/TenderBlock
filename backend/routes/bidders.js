const express = require("express");
const router = express.Router();
const multer = require("multer");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const pool = require("../database/pool");
const authorization = require("../middleware/authorization");
const { authLimiter } = require("../middleware/rateLimiter");
const {
  validate,
  signupRules,
  loginRules,
} = require("../middleware/validator");
const {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
} = require("../utils/errors");
const {
  generateHashpassword,
  validateHashpassword,
} = require("../utils/utils");

// JWT Secret
const secretToken = process.env.JWT_SECRET;

// ============================================================
// SIGNUP — POST /signup
// ============================================================
router.post(
  "/signup",
  authLimiter,
  signupRules,
  validate,
  async (request, response, next) => {
    const { name, email, registration, address, password } = request.body;

    try {
      // Encrypt the Password
      const hashPassword = await generateHashpassword(password);
      if (!hashPassword) {
        throw new AppError("Failed to process password", 500);
      }

      // Ensure tables exist (will be removed after migration runs)
      await pool.execute(`CREATE TABLE IF NOT EXISTS bidders (
        name VARCHAR(64) NOT NULL,
        email VARCHAR(128) UNIQUE NOT NULL,
        registration BIGINT UNIQUE NOT NULL,
        exp INT DEFAULT 0,
        address VARCHAR(256) NOT NULL,
        photo VARCHAR(256),
        password VARCHAR(72) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`);

      await pool.execute(
        "INSERT INTO bidders (name, email, registration, address, password) VALUES (?, ?, ?, ?, ?)",
        [name, email, registration, address, hashPassword]
      );

      response.status(201).json({
        success: true,
        data: { message: "Registration successful" },
      });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return next(new ConflictError("User with this email or registration already exists"));
      }
      next(error);
    }
  }
);

// ============================================================
// LOGIN — POST /login
// ============================================================
router.post(
  "/login",
  authLimiter,
  loginRules,
  validate,
  async (request, response, next) => {
    const { email, password } = request.body;

    try {
      const [rows] = await pool.execute(
        "SELECT name, email, registration, exp, password FROM bidders WHERE email = ?",
        [email]
      );

      if (rows.length === 0) {
        throw new AppError("No bidder found with this email", 400, "USER_NOT_FOUND");
      }

      const user = rows[0];

      // Validate User password
      const isPasswordValid = await validateHashpassword(
        password,
        user.password.toString()
      );

      if (!isPasswordValid) {
        throw new AppError("Invalid credentials", 400, "INVALID_CREDENTIALS");
      }

      // Generate JWT Token (24 hour expiry)
      const token = jwt.sign(
        {
          username: user.name,
          registration: user.registration,
          experience: user.exp,
          email: user.email,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
        secretToken
      );

      response.cookie("authorization", `bearer ${token}`, {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 Hours
        sameSite: "lax",
      });

      response.status(200).json({
        success: true,
        data: {
          message: "Logged in successfully",
          user: {
            username: user.name,
            email: user.email,
            registration: user.registration,
            experience: user.exp,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// LOGOUT — POST /logout
// ============================================================
router.post("/logout", (request, response) => {
  response.clearCookie("authorization", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  response.status(200).json({
    success: true,
    data: { message: "Logged out successfully" },
  });
});

// ============================================================
// FILE UPLOAD — POST /upload/image
// ============================================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExt = file.originalname.split(".").pop();
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + fileExt);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError("Only JPEG, JPG, PNG files are allowed"), false);
  }
};

const processFile = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
});

router.post(
  "/upload/image",
  authorization,
  processFile.single("file"),
  async (request, response, next) => {
    if (!request.file) {
      return next(new ValidationError("No image file provided"));
    }

    const payload = request.bidder;
    if (!payload || !payload.email) {
      if (request.file) fs.unlinkSync(request.file.path);
      return next(new AppError("Authentication required", 401));
    }

    try {
      const publicURL = `${request.protocol}://${request.get("host")}/uploads/${request.file.filename}`;

      await pool.execute(
        "UPDATE bidders SET photo = ? WHERE email = ?",
        [publicURL, payload.email]
      );

      response.status(200).json({
        success: true,
        data: {
          message: "Image uploaded successfully",
          url: publicURL,
        },
      });
    } catch (error) {
      if (request.file && request.file.path) {
        fs.unlinkSync(request.file.path);
      }
      next(error);
    }
  }
);

// ============================================================
// GET PROFILE — GET /user
// ============================================================
router.get("/user", authorization, async (request, response, next) => {
  const userPayload = request.bidder;
  if (!userPayload || !userPayload.email) {
    return next(new AppError("Unable to fetch data", 400));
  }

  try {
    const [rows] = await pool.execute(
      "SELECT name, email, registration, exp, address, photo FROM bidders WHERE email = ?",
      [userPayload.email]
    );

    if (rows.length === 0) {
      return next(new NotFoundError("User"));
    }

    response.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// GET JWT DATA — GET /data
// ============================================================
router.get("/data", authorization, (request, response) => {
  response.status(200).json({
    success: true,
    data: request.bidder,
  });
});

module.exports = router;
