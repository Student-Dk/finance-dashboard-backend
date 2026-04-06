const router  = require("express").Router();
const { register, login, getMe } = require("../controllers/auth.controller");
const { protect }                = require("../middleware/auth.middleware");
const { loginLimiter }           = require("../middleware/rateLimit.middleware");
const { validate, registerRules, loginRules } = require("../middleware/validate.middleware");

// public routes
router.post("/register", registerRules, validate, register);
router.post("/login",    loginLimiter, loginRules, validate, login);

// protected — requires valid token
router.get("/me", protect, getMe);

module.exports = router;
