const { body, validationResult } = require("express-validator");

// collect validation errors from preceding rules and return 400 if any exist
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
};

const registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters"),

  body("email")
    .trim()
    .isEmail().withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

  body("adminKey")
    .optional()
    .isString().withMessage("adminKey must be a string"),

  // role is intentionally excluded — cannot be set from request body at registration
];

const loginRules = [
  body("email")
    .trim()
    .isEmail().withMessage("Please provide a valid email"),

  body("password")
    .notEmpty().withMessage("Password is required"),
];

const recordRules = [
  body("amount")
    .isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),

  body("type")
    .isIn(["income", "expense"]).withMessage("Type must be income or expense"),

  body("category")
    .isIn([
      "salary", "freelance", "investment",
      "food", "rent", "transport",
      "shopping", "health", "education",
      "entertainment", "other",
    ])
    .withMessage("Invalid category"),

  body("date")
    .optional()
    .isISO8601().withMessage("Date must be in YYYY-MM-DD format"),

  body("notes")
    .optional()
    .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
];

module.exports = { validate, registerRules, loginRules, recordRules };
