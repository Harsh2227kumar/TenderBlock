const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
require("dotenv").config();

const { generalLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

// Initialize Express app
const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
app.disable("x-powered-by");
app.use(helmet());

// ============================================================
// RATE LIMITING (applied to all routes)
// ============================================================
app.use(generalLimiter);

// ============================================================
// PARSING MIDDLEWARE
// ============================================================
app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// ============================================================
// CORS CONFIGURATION
// ============================================================
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ============================================================
// STATIC FILES
// ============================================================
app.use("/uploads", express.static("uploads"));

// ============================================================
// ROUTES
// ============================================================
app.use(require("./routes/bidders.js"));
app.use(require("./routes/tender.js"));

// Health check endpoint
app.get("/", (request, response) => {
  response.status(200).json({
    success: true,
    data: {
      name: "TenderBlock API",
      version: "2.0.0",
      type: "nodejs-server",
      status: "running",
      environment: process.env.NODE_ENV || "development",
    },
  });
});

// Health check for monitoring
app.get("/health", (request, response) => {
  response.status(200).json({
    success: true,
    data: {
      status: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================================
// 404 HANDLER (must be after all routes)
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// ============================================================
// GLOBAL ERROR HANDLER (must be LAST middleware)
// ============================================================
app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================
const port = process.env.PORT || "5000";

app.listen(port, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║         TenderBlock API Server v2.0              ║
╠══════════════════════════════════════════════════╣
║  Status:      Running                            ║
║  URL:         http://localhost:${port}               ║
║  Environment: ${(process.env.NODE_ENV || "development").padEnd(33)}║
╚══════════════════════════════════════════════════╝
  `);
});
