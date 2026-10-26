
const { body, validationResult } = require("express-validator");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const { executeCode } = require("../services/codeExecutionService");

const validateSubmission = [
  body("slug")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Problem slug is required.")
    .isLength({ max: 150 }),

  body("code")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Code cannot be empty.")
    .isLength({ max: 20000 }),

  body("language")
    .isIn(["cpp", "javascript", "python"])
    .withMessage("Unsupported programming language."),
];

const normalizeOutput = (output) =>
  String(output ?? "").trim().split(/\s+/).filter(Boolean).join(" ");

const submitCode = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { slug, code, language } = req.body;

    // Fetch test cases only on the backend.
    const problem = await Problem.findOne({
      slug: slug.toLowerCase(),
      isPublished: true,
    }).select("+testCases");

    if (!problem) {
      return res.status(404).json({ message: "Problem not found." });
    }

    if (!problem.testCases || problem.testCases.length === 0) {
      return res.status(400).json({
        message: "No test cases are configured for this problem.",
      });
    }

    const results = [];
    let verdict = "Accepted";
    let totalTime = 0;
    let totalMemory = 0;

    for (let i = 0; i < problem.testCases.length; i++) {
      const testCase = problem.testCases[i];
      let execution;

      try {
        execution = await executeCode({
          code,
          language,
          input: testCase.input,
        });
      } catch (error) {
        verdict =
          error.statusCode === 504
            ? "Time Limit Exceeded"
            : "Execution Error";

        results.push({
          testCase: i + 1,
          status: verdict,
        });

        break;
      }

      totalTime += Number(execution.time) || 0;
      totalMemory = Math.max(
        totalMemory,
        Number(execution.memory) || 0
      );

      if (execution.status === "Compilation Error") {
        verdict = "Compilation Error";
        results.push({
          testCase: i + 1,
          status: verdict,
          message: execution.compile_output,
        });
        break;
      }

      if (execution.status === "Time Limit Exceeded") {
        verdict = "Time Limit Exceeded";
        results.push({ testCase: i + 1, status: verdict });
        break;
      }

      if (execution.status !== "Accepted") {
        verdict = "Runtime Error";
        results.push({
          testCase: i + 1,
          status: verdict,
          message: execution.stderr || execution.status,
        });
        break;
      }

      const actual = normalizeOutput(execution.stdout);
      const expected = normalizeOutput(testCase.expectedOutput);

      if (actual !== expected) {
        verdict = "Wrong Answer";
        results.push({
          testCase: i + 1,
          status: verdict,
          ...(testCase.isHidden
            ? {}
            : {
                expectedOutput: testCase.expectedOutput,
                actualOutput: execution.stdout,
              }),
        });
        break;
      }

      results.push({
        testCase: i + 1,
        status: "Passed",
      });
    }

    const passed = results.filter(
      (item) => item.status === "Passed"
    ).length;

    const time = Number(totalTime.toFixed(3));

    // Save the submission using the authenticated user's ID.
    // authMiddleware must set req.user.userId.
    await Submission.create({
      user: req.user.userId,
      problem: problem._id,
      problemSlug: problem.slug,
      code,
      language,
      verdict,
      passed,
      total: problem.testCases.length,
      time,
      memory: totalMemory,
    });

    return res.status(200).json({
      verdict,
      passed,
      total: problem.testCases.length,
      time,
      memory: totalMemory,
      results,
    });
  } catch (error) {
    console.error("Submission error:", error.message);
    return res.status(500).json({
      message: "Failed to evaluate submission.",
    });
  }
};

const getSubmissionHistory = async (req, res) => {
  try {
    const submissions = await Submission.find({
      user: req.user.userId,
    })
      .populate("problem", "title slug difficulty")
      .select("-code")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Submission history error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch submission history.",
    });
  }
};

module.exports = {
  validateSubmission,
  submitCode,
  getSubmissionHistory,
};
