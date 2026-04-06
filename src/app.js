const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { generalLimiter } = require("./middleware/rateLimit.middleware");

dotenv.config();

const app = express();

// parse incoming JSON requests
app.use(express.json());

// apply rate limiting to all /api routes
app.use("/api", generalLimiter);

app.use("/api/auth",      require("./routes/auth.routes"));
app.use("/api/users",     require("./routes/user.routes"));
app.use("/api/records",   require("./routes/record.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));

// simple health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Finance Dashboard API is running",
    version: "1.0.0",
  });
});

// 404 handler — catches any unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

module.exports = app;
