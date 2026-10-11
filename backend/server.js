const authRoutes = require("./routes/authRoutes");
const problemRoutes = require("./routes/problemRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());
app.use(morgan("dev"));
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);

app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({
    message: "Authentication successful",
    user: req.user,
  });
});
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CodeForge API is running!",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "CodeForge Backend",
    status: "healthy",
  });
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`CodeForge backend running on port ${PORT}`);
  });
};

startServer();

