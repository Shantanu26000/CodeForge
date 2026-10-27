const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getUserProgress,
  getSolvedProblems,
} = require("../controllers/progressController");

const router = express.Router();

router.get("/", authMiddleware, getUserProgress);
router.get("/solved", authMiddleware, getSolvedProblems);

module.exports = router;