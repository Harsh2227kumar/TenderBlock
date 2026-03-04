// middleware/validator.js — Input Validation Middleware
// Uses express-validator for declarative validation

const { body, param, query, validationResult } = require("express-validator");
const { ValidationError } = require("../utils/errors");

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const details = errors.array().map((err) => ({
            field: err.path,
            message: err.msg,
            value: err.value,
        }));
        throw new ValidationError("Invalid input data", details);
    }
    next();
};

// Signup validation rules
const signupRules = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 2, max: 64 })
        .withMessage("Name must be 2-64 characters")
        .escape(),
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail()
        .isLength({ max: 128 })
        .withMessage("Email must be under 128 characters"),
    body("registration")
        .notEmpty()
        .withMessage("Registration ID is required")
        .isNumeric()
        .withMessage("Registration ID must be a number"),
    body("address")
        .trim()
        .notEmpty()
        .withMessage("Address is required")
        .isLength({ min: 5, max: 256 })
        .withMessage("Address must be 5-256 characters")
        .escape(),
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
];

// Login validation rules
const loginRules = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
    body("password")
        .notEmpty()
        .withMessage("Password is required"),
];

// Tender creation validation rules
const tenderCreateRules = [
    body("_title")
        .trim()
        .notEmpty()
        .withMessage("Title is required")
        .isLength({ min: 3, max: 128 })
        .withMessage("Title must be 3-128 characters")
        .escape(),
    body("tender_id")
        .trim()
        .notEmpty()
        .withMessage("Tender ID is required"),
    body("_ipfsHash")
        .trim()
        .notEmpty()
        .withMessage("IPFS hash is required"),
    body("_description")
        .trim()
        .notEmpty()
        .withMessage("Description is required")
        .isLength({ min: 10 })
        .withMessage("Description must be at least 10 characters"),
    body("_minimumExp")
        .notEmpty()
        .withMessage("Minimum experience is required")
        .isInt({ min: 0 })
        .withMessage("Minimum experience must be a non-negative integer"),
    body("_exp")
        .notEmpty()
        .withMessage("Experience reward is required")
        .isInt({ min: 0 })
        .withMessage("Experience reward must be a non-negative integer"),
    body("opening_date")
        .notEmpty()
        .withMessage("Opening date is required"),
    body("biddingLength")
        .notEmpty()
        .withMessage("Bidding duration is required")
        .isInt({ min: 1 })
        .withMessage("Bidding duration must be a positive integer"),
    body("startPrice")
        .notEmpty()
        .withMessage("Start price is required")
        .isInt({ min: 1 })
        .withMessage("Start price must be a positive integer"),
];

// Bid placement validation rules
const bidRules = [
    body("tender_id")
        .trim()
        .notEmpty()
        .withMessage("Tender ID is required")
        .not()
        .equals("ERROR")
        .withMessage("Invalid tender ID"),
    body("biddingAmount")
        .notEmpty()
        .withMessage("Bidding amount is required")
        .isNumeric()
        .withMessage("Bidding amount must be a number")
        .custom((value) => {
            if (parseFloat(value) <= 0) {
                throw new Error("Bidding amount must be greater than 0");
            }
            return true;
        }),
];

// Settlement validation rules
const settleRules = [
    body("tender_id")
        .trim()
        .notEmpty()
        .withMessage("Tender ID is required"),
];

// Tender ID param validation
const tenderIdParam = [
    param("id")
        .trim()
        .notEmpty()
        .withMessage("Tender ID is required"),
];

module.exports = {
    validate,
    signupRules,
    loginRules,
    tenderCreateRules,
    bidRules,
    settleRules,
    tenderIdParam,
};
