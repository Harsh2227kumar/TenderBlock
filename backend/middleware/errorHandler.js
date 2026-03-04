// middleware/errorHandler.js — Global Error Handler
// Must be the LAST middleware registered in server.js
// Catches all errors and sends safe, formatted responses

const errorHandler = (err, req, res, _next) => {
    // Default to 500 if no status code set
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || false;

    // Log full error internally (never expose to client)
    console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);

    // Determine safe message
    const message = isOperational ? err.message : "Internal server error";
    const code = err.code || "INTERNAL_ERROR";

    // Build error response
    const errorResponse = {
        success: false,
        error: {
            code,
            message,
        },
    };

    // Add validation details if present
    if (err.details && err.details.length > 0) {
        errorResponse.error.details = err.details;
    }

    // Handle specific MySQL errors gracefully
    if (err.code === "ER_DUP_ENTRY") {
        errorResponse.error.code = "CONFLICT";
        errorResponse.error.message = "This record already exists";
        return res.status(409).json(errorResponse);
    }

    if (err.code === "ECONNREFUSED") {
        errorResponse.error.code = "SERVICE_UNAVAILABLE";
        errorResponse.error.message = "Database connection failed. Please try again later.";
        return res.status(503).json(errorResponse);
    }

    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
