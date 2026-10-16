
const { executeCode } = require("../services/codeExecutionService");

const runCode = async (req, res) => {
  try {
    const { code, language, input = "" } = req.body || {};

    const result = await executeCode({ code, language, input });

    return res.status(200).json({ result });
  } catch (error) {
    const statusCode = error.statusCode || 500;

    if (statusCode === 500) {
      console.error("Code execution error:", error.message);
    }

    return res.status(statusCode).json({
      message:
        statusCode === 500
          ? "Internal server error."
          : error.message,
    });
  }
};

module.exports = { runCode };
