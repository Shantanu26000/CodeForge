
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
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
  verdict =
    execution.status === "Time Limit Exceeded"
      ? "Time Limit Exceeded"
      : "Runtime Error";

  results.push({
    testCase: i + 1,
    status: verdict,
    ...(testCase.isHidden
      ? {}
      : { message: execution.stderr || execution.status }),
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


const getStreak = async (req, res) => {
  try {
    // Only Accepted submissions count. Multiple accepted submissions on one
    // calendar day count as one active day.
    const acceptedDates = await Submission.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.userId),
          verdict: "Accepted",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const dates = acceptedDates.map((item) => item._id);
    const activeDays = new Set(dates);
    const dayFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const dayKey = (date) => {
      const parts = dayFormatter.formatToParts(date);
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      return `${values.year}-${values.month}-${values.day}`;
    };

    const today = dayKey(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterday = dayKey(yesterdayDate);

    let currentStreak = 0;
    if (dates.length && (activeDays.has(today) || activeDays.has(yesterday))) {
      let cursor = new Date(`${activeDays.has(today) ? today : yesterday}T00:00:00.000Z`);
      while (activeDays.has(cursor.toISOString().slice(0, 10))) {
        currentStreak += 1;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
    }

    let longestStreak = 0;
    let runningStreak = 0;
    let previousDate = null;

    for (const dateString of [...dates].sort()) {
      const currentDate = new Date(`${dateString}T00:00:00.000Z`);
      if (previousDate) {
        const difference = (currentDate - previousDate) / 86400000;
        runningStreak = difference === 1 ? runningStreak + 1 : 1;
      } else {
        runningStreak = 1;
      }
      longestStreak = Math.max(longestStreak, runningStreak);
      previousDate = currentDate;
    }

    return res.status(200).json({
      currentStreak,
      longestStreak,
      activeDays: dates.length,
      lastSolvedDate: dates[0] || null,
      calendarTimezone: "Asia/Kolkata",
    });
  } catch (error) {
    console.error("Streak error:", error.message);
    return res.status(500).json({ message: "Failed to fetch streak." });
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
  getStreak,
};
