// emergency script to create an admin user directly in the database
// use this only when the DB already has users and no admin exists
// run with: npm run create-admin

const mongoose = require("mongoose");
const dotenv   = require("dotenv");
dotenv.config();

const User = require("../src/models/user.model");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected");

    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      console.log("Admin already exists:", existing.email);
      console.log("Use PATCH /api/users/:id/role to manage roles.");
      return;
    }

    // password is plain text here — pre-save hook will hash it automatically
    const admin = await User.create({
      name:     "Super Admin",
      email:    "admin@finance.com",   // change this before running
      password: "Admin@123456",        // change this to a strong password
      role:     "admin",
    });

    console.log("Admin created successfully!");
    console.log("Email:", admin.email);
    console.log("Login via POST /api/auth/login");

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();
