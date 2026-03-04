// utils/errors.js — Custom Error Classes
// Used throughout the backend for consistent error handling

class AppError extends Error {
    constructor(message, statusCode, code = "INTERNAL_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, details = []) {
        super(message, 400, "VALIDATION_ERROR");
        this.details = details;
    }
}

class NotFoundError extends AppError {
    constructor(resource = "Resource") {
        super(`${resource} not found`, 404, "NOT_FOUND");
    }
}

class UnauthorizedError extends AppError {
    constructor(message = "Authentication required") {
        super(message, 401, "UNAUTHORIZED");
    }
}

class ForbiddenError extends AppError {
    constructor(message = "Access denied") {
        super(message, 403, "FORBIDDEN");
    }
}

class ConflictError extends AppError {
    constructor(message = "Resource already exists") {
        super(message, 409, "CONFLICT");
    }
}

class RateLimitError extends AppError {
    constructor() {
        super("Too many requests, please try again later", 429, "RATE_LIMIT_EXCEEDED");
    }
}

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    RateLimitError,
};
