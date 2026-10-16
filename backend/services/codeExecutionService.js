
const axios = require("axios");

const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL || "https://ce.judge0.com";

const LANGUAGE_IDS = {
  cpp: 54,        // C++ (GCC 9.2.0)
  javascript: 63, // JavaScript (Node.js 12.14.0)
  python: 71,     // Python (3.8.1)
};

async function executeCode({ code, language, input = "" }) {
  const languageId = LANGUAGE_IDS[language];

  if (!languageId) {
    const error = new Error("Unsupported programming language.");
    error.statusCode = 400;
    throw error;
  }

  if (typeof code !== "string" || !code.trim()) {
    const error = new Error("Code cannot be empty.");
    error.statusCode = 400;
    throw error;
  }

  if (code.length > 20000) {
    const error = new Error("Code exceeds the 20,000-character limit.");
    error.statusCode = 400;
    throw error;
  }

  if (typeof input !== "string" || input.length > 10000) {
    const error = new Error("Input must be text of at most 10,000 characters.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const response = await axios.post(
      `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin: input,
        cpu_time_limit: 2,
        wall_time_limit: 5,
        memory_limit: 128000,
      },
      {
        timeout: 15000,
        headers: { "Content-Type": "application/json" },
      }
    );

    return {
      stdout: response.data.stdout || "",
      stderr: response.data.stderr || "",
      compile_output: response.data.compile_output || "",
      status: response.data.status?.description || "Unknown",
      time: response.data.time ?? null,
      memory: response.data.memory ?? null,
    };
  } catch (error) {
    if (error.response) {
      console.error("Judge0 API error:", error.response.status);
      const apiError = new Error("Code execution service returned an error.");
      apiError.statusCode = 502;
      throw apiError;
    }

    if (error.code === "ECONNABORTED") {
      const timeoutError = new Error("Code execution request timed out.");
      timeoutError.statusCode = 504;
      throw timeoutError;
    }

    const serviceError = new Error("Code execution service is unavailable.");
    serviceError.statusCode = 502;
    throw serviceError;
  }
}

module.exports = { executeCode };
