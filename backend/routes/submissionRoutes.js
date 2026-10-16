
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  validateSubmission,
  submitCode,
} = require("../controllers/submissionController");

const router = express.Router();

router.post("/", authMiddleware, validateSubmission, submitCode);

module.exports = router;
