
const Submission = require("../models/Submission");

const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [totalSubmissions, acceptedSubmissions, solvedProblems] =
      await Promise.all([
        Submission.countDocuments({ user: userId }),

        Submission.countDocuments({
          user: userId,
          verdict: "Accepted",
        }),

        Submission.distinct("problem", {
          user: userId,
          verdict: "Accepted",
        }),
      ]);

    const acceptanceRate =
      totalSubmissions === 0
        ? 0
        : Number(
            ((acceptedSubmissions / totalSubmissions) * 100).toFixed(2)
          );

    return res.status(200).json({
      totalSubmissions,
      acceptedSubmissions,
      solvedProblems: solvedProblems.length,
      acceptanceRate,
    });
  } catch (error) {
    console.error("User progress error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch user progress.",
    });
  }
};

module.exports = { getUserProgress };
