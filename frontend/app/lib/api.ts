
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export type Problem = {
  _id: string;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  createdAt?: string;
};

export async function getProblems(params?: {
  search?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.difficulty && params.difficulty !== "All") {
    query.set("difficulty", params.difficulty);
  }

  query.set("page", String(params?.page ?? 1));
  query.set("limit", String(params?.limit ?? 50));

  const response = await fetch(
    `${API_BASE_URL}/problems?${query.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch problems (${response.status})`);
  }

  return response.json() as Promise<{
    problems: Problem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
}
