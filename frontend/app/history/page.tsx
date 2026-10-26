
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Submission = {
  _id: string;
  problemSlug: string;
  verdict: string;
  passed: number;
  total: number;
  language: string;
  time: number;
  memory: number;
  createdAt: string;
  problem?: {
    title: string;
    slug: string;
    difficulty: "Easy" | "Medium" | "Hard";
  } | null;
};

export default function HistoryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please log in to view your submission history.");
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/submissions/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load submission history."
          );
        }

        setSubmissions(data.submissions || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (date: string) =>
    new Date(date).toLocaleString();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-6 inline-flex text-sm text-violet-300 transition hover:text-violet-200"
        >
          ← Back to Problems
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Submission History
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Review your previous attempts and results.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
            Loading your submissions...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            {error}
            {error.toLowerCase().includes("log in") && (
              <div className="mt-4">
                <Link
                  href="/login"
                  className="font-medium underline"
                >
                  Go to Login
                </Link>
              </div>
            )}
          </div>
        ) : submissions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h2 className="text-lg font-semibold">
              No submissions yet
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Solve a problem and submit your code to see it here.
            </p>
            <Link
              href="/"
              className="mt-5 inline-block rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium transition hover:bg-violet-500"
            >
              Explore Problems
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Total Submissions
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {submissions.length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Accepted
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-400">
                  {submissions.filter(
                    (item) => item.verdict === "Accepted"
                  ).length}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Problems Attempted
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {
                    new Set(
                      submissions.map((item) => item.problemSlug)
                    ).size
                  }
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                    <tr>
                      <th className="px-5 py-4 font-medium">
                        Problem
                      </th>
                      <th className="px-5 py-4 font-medium">
                        Verdict
                      </th>
                      <th className="px-5 py-4 font-medium">
                        Language
                      </th>
                      <th className="px-5 py-4 font-medium">
                        Test Cases
                      </th>
                      <th className="px-5 py-4 font-medium">
                        Submitted At
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {submissions.map((submission) => (
                      <tr
                        key={submission._id}
                        className="transition hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/problems/${encodeURIComponent(
                              submission.problem?.slug ||
                                submission.problemSlug
                            )}`}
                            className="font-medium text-slate-200 hover:text-violet-300"
                          >
                            {submission.problem?.title ||
                              submission.problemSlug}
                          </Link>
                          {submission.problem?.difficulty && (
                            <p
                              className={`mt-1 text-xs ${
                                submission.problem.difficulty === "Easy"
                                  ? "text-emerald-400"
                                  : submission.problem.difficulty === "Medium"
                                  ? "text-amber-400"
                                  : "text-red-400"
                              }`}
                            >
                              {submission.problem.difficulty}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              submission.verdict === "Accepted"
                                ? "bg-emerald-400/10 text-emerald-400"
                                : "bg-red-400/10 text-red-400"
                            }`}
                          >
                            {submission.verdict}
                          </span>
                        </td>

                        <td className="px-5 py-4 uppercase text-slate-300">
                          {submission.language === "cpp"
                            ? "C++"
                            : submission.language}
                        </td>

                        <td className="px-5 py-4 tabular-nums text-slate-300">
                          {submission.passed} / {submission.total}
                        </td>

                        <td className="px-5 py-4 text-slate-400">
                          {formatDate(submission.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Showing your 100 most recent submissions.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
