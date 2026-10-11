
const express = require("express");
const {
  createProblem,
  getProblems,
  getProblemById,
  validateProblem,
  validateProblemQuery,
  validateProblemId,
} = require("../controllers/problemController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// List published problems
router.get("/", validateProblemQuery, getProblems);

// Get a published problem by ID
router.get("/:id", validateProblemId, getProblemById);

// Create a problem (admins only)
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  validateProblem,
  createProblem
);

module.exports = router;
