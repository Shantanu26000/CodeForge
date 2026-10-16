
const express = require("express");
const { body } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const { runCode } = require("../controllers/codeExecutionController");

const router = express.Router();

const validateExecution = [
  body("code")
    .isString()
    .withMessage("Code must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Code cannot be empty.")
    .bail()
    .isLength({ max: 20000 })
    .withMessage("Code exceeds the 20,000-character limit."),

  body("language")
    .isIn(["cpp", "javascript", "python"])
    .withMessage("Unsupported programming language."),

  body("input")
    .optional()
    .isString()
    .withMessage("Input must be a string.")
    .bail()
    .isLength({ max: 10000 })
    .withMessage("Input exceeds the 10,000-character limit."),
];

router.post("/", authMiddleware, validateExecution, (req, res, next) => {
  const { validationResult } = require("express-validator");
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next();
}, runCode);

module.exports = router;
