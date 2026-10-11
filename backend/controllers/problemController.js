
const { body, query, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Problem = require("../models/Problem");

const validateProblem = [
  body("title").trim().isLength({ min: 3, max: 150 }),
  body("description").trim().isLength({ min: 10 }),
  body("difficulty").isIn(["Easy", "Medium", "Hard"]),
  body("tags").optional().isArray(),
  body("constraints").optional().isArray(),
  body("examples").isArray({ min: 1 }),
  body("examples.*.input").isString(),
  body("examples.*.output").isString(),
  body("examples.*.explanation").optional().isString(),
];

const validateProblemQuery = [
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
  query("difficulty").optional().isIn(["Easy", "Medium", "Hard"]),
  query("search").optional().isString().trim().isLength({ max: 100 }),
];

const validateProblemId = [
  param("id").isMongoId().withMessage("Invalid problem ID"),
];

const createProblem = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, difficulty, tags, constraints, examples } = req.body;

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const problem = await Problem.create({
      title,
      slug,
      description,
      difficulty,
      tags,
      constraints,
      examples,
      createdBy: req.user.userId,
      isPublished: req.user.role === "admin",
    });

    return res.status(201).json({
      message: "Problem created successfully",
      problem,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "A problem with this title already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Create problem error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getProblems = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const { difficulty, search } = req.query;

    const filter = { isPublished: true };

    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.$text = { $search: search };

    const [problems, total] = await Promise.all([
      Problem.find(filter)
        .select("title slug difficulty tags createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Problem.countDocuments(filter),
    ]);

    return res.status(200).json({
      problems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get problems error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getProblemById = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const problem = await Problem.findOne({
      _id: new mongoose.Types.ObjectId(id),
      isPublished: true,
    }).lean();

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    return res.status(200).json({ problem });
  } catch (error) {
    console.error("Get problem error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createProblem,
  getProblems,
  getProblemById,
  validateProblem,
  validateProblemQuery,
  validateProblemId,
};
