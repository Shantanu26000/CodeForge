
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./config/db");

const submissionRoutes = require("./routes/submissionRoutes");
const progressRoutes = require("./routes/progressRoutes");
const authRoutes = require("./routes/authRoutes");
const codeExecutionRoutes = require("./routes/codeExecutionRoutes");
const problemRoutes = require("./routes/problemRoutes");

const authMiddleware = require("./middleware/authMiddleware");

const {
  loginLimiter,
  registerLimiter,
  executionLimiter,
  submissionLimiter,
} = require("./middleware/rateLimiters");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json({ limit: "100kb" }));
app.use(morgan("dev"));

// Authentication rate limits
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", registerLimiter);

// Existing API routes
app.use("/api/auth", authRoutes);
app.use("/api/progress", progressRoutes);

// Code execution and submission rate limits
app.use("/api/execute", executionLimiter, codeExecutionRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionLimiter, submissionRoutes);

// Current authenticated user
app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({
    message: "Authentication successful",
    user: req.user,
  });
});

// Root health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CodeForge API is running!",
  });
});

// API health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "CodeForge Backend",
    status: "healthy",
  });
});

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`CodeForge backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start CodeForge backend:", error.message);
    process.exit(1);
  }
};

startServer();
