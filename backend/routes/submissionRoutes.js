
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  validateSubmission,
  submitCode,
  getSubmissionHistory,
} = require("../controllers/submissionController");

const router = express.Router();

router.get("/history", authMiddleware, getSubmissionHistory);
router.post("/", authMiddleware, validateSubmission, submitCode);

module.exports = router;
