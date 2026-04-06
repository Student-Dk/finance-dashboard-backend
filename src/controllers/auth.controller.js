const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const generateToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, adminKey } = req.body;

    if (await User.findOne({ email })) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    // default role is viewer
    // first registered user becomes admin automatically (fresh deployment)
    // subsequent admins can be created using the admin secret key
    let role = "viewer";

    const totalUsers = await User.countDocuments();

    if (totalUsers === 0) {
      role = "admin";
    } else if (
      adminKey &&
      process.env.ADMIN_SECRET_KEY &&
      adminKey === process.env.ADMIN_SECRET_KEY
    ) {
      role = "admin";
    }
    // wrong adminKey silently falls back to viewer — no hints to attackers

    const user = await User.create({ name, email, password, role });

    const token = generateToken(user._id);
    user.password = undefined;

    return res.status(201).json({
      success: true,
      message: role === "admin"
        ? "Admin account created successfully!"
        : "Account created successfully!",
      token,
      data: { user },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // password field has select:false so we need to explicitly request it
    const user = await User.findOne({ email }).select("+password");

    // use same error message for wrong email and wrong password
    // different messages would allow attackers to enumerate valid emails
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account deactivated. Please contact admin.",
      });
    }

    const token = generateToken(user._id);
    user.password = undefined;

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      data: { user },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: { user: req.user },
  });
};

module.exports = { register, login, getMe };
