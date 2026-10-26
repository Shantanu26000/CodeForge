
const axios = require("axios");

const JUDGE0_BASE_URL = (
  process.env.JUDGE0_BASE_URL || "https://ce.judge0.com"
).replace(/\/+$/, "");

const LANGUAGE_IDS = {
  cpp: 54,
  javascript: 63,
  python: 71,
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
    const error = new Error(
      "Input must be text of at most 10,000 characters."
    );
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
        cpu_time_limit: 5,
        wall_time_limit: 10,
        memory_limit: 128000,
      },
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const data = response.data;
    const status = data.status?.description || "Unknown";

    return {
      stdout: data.stdout || "",
      stderr: data.stderr || "",
      compile_output: data.compile_output || "",
      status,
      time: data.time ?? null,
      memory: data.memory ?? null,
    };
  } catch (error) {
    if (error.response) {
      console.error(
        "Judge0 API error:",
        error.response.status,
        error.response.data
      );

      const apiError = new Error(
        "Code execution service returned an error."
      );
      apiError.statusCode = 502;
      throw apiError;
    }

    if (
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {
      const timeoutError = new Error(
        "Code execution service timed out."
      );
      timeoutError.statusCode = 504;
      throw timeoutError;
    }

    console.error("Judge0 connection error:", error.message);

    const serviceError = new Error(
      "Code execution service is unavailable."
    );
    serviceError.statusCode = 502;
    throw serviceError;
  }
}

module.exports = { executeCode };
