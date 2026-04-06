const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// verifies JWT token and attaches user to req.user
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please login first.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    // block deactivated accounts even if token is valid
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Contact admin.",
      });
    }

    req.user = user;
    next();

  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token." });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired. Please login again." });
    }
    return res.status(500).json({ success: false, message: "Authentication error." });
  }
};

// role-based access control — pass allowed roles as arguments
// e.g. restrictTo("admin") or restrictTo("admin", "analyst")
const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. This action requires: ${allowedRoles.join(" or ")} role. Your role: ${req.user.role}`,
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
