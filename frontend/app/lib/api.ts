
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type Problem = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  createdAt?: string;
};

export type ExecutionResult = {
  stdout: string;
  stderr: string;
  compile_output: string;
  status: string;
  time: number | null;
  memory: number | null;
};

export type SubmissionResult = {
  verdict: string;
  passed: number;
  total: number;
  time: number;
  memory: number;
  results: {
    testCase: number;
    status: string;
    message?: string;
    expectedOutput?: string;
    actualOutput?: string;
  }[];
};

type ProblemQuery = {
  search?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
};

export async function getProblems(params: ProblemQuery = {}) {
  const query = new URLSearchParams();

  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.difficulty && params.difficulty !== "All") {
    query.set("difficulty", params.difficulty);
  }
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));

  const queryString = query.toString();
  const url = `${API_BASE_URL}/problems${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load problems.");
  }

  return data as {
    problems: Problem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export async function getProblemBySlug(slug: string) {
  const response = await fetch(
    `${API_BASE_URL}/problems/slug/${encodeURIComponent(slug)}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load problem.");
  }

  return data as { problem: Problem };
}

export async function executeCode({
  code,
  language,
  input = "",
  token,
}: {
  code: string;
  language: "cpp" | "javascript" | "python";
  input?: string;
  token: string;
}) {
  const response = await fetch(`${API_BASE_URL}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code, language, input }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || data.errors?.[0]?.msg || "Code execution failed."
    );
  }

  return data as { result: ExecutionResult };
}

export async function submitCode({
  slug,
  code,
  language,
  token,
}: {
  slug: string;
  code: string;
  language: "cpp" | "javascript" | "python";
  token: string;
}): Promise<SubmissionResult> {
  const response = await fetch(`${API_BASE_URL}/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ slug, code, language }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || data.errors?.[0]?.msg || "Submission failed."
    );
  }

  return data as SubmissionResult;
}
