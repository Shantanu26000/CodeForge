"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Sun, Moon } from "lucide-react";

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

type Theme = "dark" | "light";

export default function HistoryPage() {
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("codeforge-theme");
    const initialTheme: Theme = savedTheme === "light" ? "light" : "dark";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("codeforge-theme", nextTheme);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchHistory = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login?redirect=/history");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/submissions/history`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          if (!cancelled) {
            setIsLoggedIn(false);
            router.replace("/login?redirect=/history");
          }
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Failed to load submission history.");
        }

        if (!cancelled) {
          setSubmissions(data.submissions || []);
          setIsLoggedIn(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setSubmissions([]);
    router.replace("/login");
  };

  const formatDate = (date: string) => new Date(date).toLocaleString();
  const isDark = theme === "dark";

  const pageClass = isDark
    ? "min-h-screen bg-[#101114] px-4 py-8 text-[#f4f4f5] transition-colors sm:px-8"
    : "min-h-screen bg-[#f8fafc] px-4 py-8 text-[#111827] transition-colors sm:px-8";
  const surfaceClass = isDark
    ? "border-[#303138] bg-[#18191e]"
    : "border-[#e2e8f0] bg-white";
  const mutedTextClass = isDark ? "text-[#a1a1aa]" : "text-[#64748b]";
  const subtleTextClass = isDark ? "text-[#71717a]" : "text-[#94a3b8]";
  const accentTextClass = isDark
    ? "text-[#d6a77a] hover:text-[#f59e0b]"
    : "text-[#2563eb] hover:text-[#1d4ed8]";
  const primaryButtonClass = isDark
    ? "bg-[#f59e0b] text-[#101114] hover:bg-[#d97706]"
    : "bg-[#2563eb] text-white hover:bg-[#1d4ed8]";

  return (
    <main className={pageClass}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/" className={`inline-flex text-sm transition ${accentTextClass}`}>
            ← Back to Problems
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              title={`Switch to ${isDark ? "light" : "dark"} mode`}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                isDark
                  ? "border-[#414149] bg-[#202126] text-[#f4f4f5] hover:border-[#f59e0b] hover:text-[#f59e0b]"
                  : "border-[#e2e8f0] bg-white text-[#111827] hover:border-[#2563eb] hover:text-[#2563eb]"
              }`}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
              <span className="hidden sm:inline">{isDark ? "Light mode" : "Dark mode"}</span>
            </button>

            {isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
              >
                <LogOut size={16} />
                Logout
              </button>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Submission History</h1>
          <p className={`mt-2 text-sm ${mutedTextClass}`}>
            Review your previous attempts and results.
          </p>
        </div>

        {loading ? (
          <div className={`rounded-2xl border p-8 text-center ${surfaceClass} ${mutedTextClass}`}>
            Checking your session and loading submissions...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-600 dark:text-red-300">
            {error}
            <button type="button" onClick={() => window.location.reload()} className="ml-3 underline">
              Retry
            </button>
          </div>
        ) : submissions.length === 0 ? (
          <div className={`rounded-2xl border p-10 text-center ${surfaceClass}`}>
            <h2 className="text-lg font-semibold">No submissions yet</h2>
            <p className={`mt-2 text-sm ${mutedTextClass}`}>
              Solve a problem and submit your code to see it here.
            </p>
            <Link
              href="/"
              className={`mt-5 inline-block rounded-lg px-5 py-2.5 text-sm font-medium transition ${primaryButtonClass}`}
            >
              Explore Problems
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              <div className={`rounded-xl border p-5 ${surfaceClass}`}>
                <p className={`text-sm ${mutedTextClass}`}>Total Submissions</p>
                <p className="mt-2 text-2xl font-bold">{submissions.length}</p>
              </div>

              <div className={`rounded-xl border p-5 ${surfaceClass}`}>
                <p className={`text-sm ${mutedTextClass}`}>Accepted</p>
                <p className="mt-2 text-2xl font-bold text-emerald-500">
                  {submissions.filter((item) => item.verdict === "Accepted").length}
                </p>
              </div>

              <div className={`rounded-xl border p-5 ${surfaceClass}`}>
                <p className={`text-sm ${mutedTextClass}`}>Problems Attempted</p>
                <p className="mt-2 text-2xl font-bold">
                  {new Set(submissions.map((item) => item.problemSlug)).size}
                </p>
              </div>
            </div>

            <div className={`overflow-hidden rounded-2xl border ${surfaceClass}`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead
                    className={`border-b ${
                      isDark
                        ? "border-[#303138] bg-[#202126] text-[#a1a1aa]"
                        : "border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b]"
                    }`}
                  >
                    <tr>
                      <th className="px-5 py-4 font-medium">Problem</th>
                      <th className="px-5 py-4 font-medium">Verdict</th>
                      <th className="px-5 py-4 font-medium">Language</th>
                      <th className="px-5 py-4 font-medium">Test Cases</th>
                      <th className="px-5 py-4 font-medium">Submitted At</th>
                    </tr>
                  </thead>

                  <tbody className={`divide-y ${isDark ? "divide-[#303138]" : "divide-[#e2e8f0]"}`}>
                    {submissions.map((submission) => (
                      <tr
                        key={submission._id}
                        className={`transition ${isDark ? "hover:bg-[#202126]" : "hover:bg-[#f8fafc]"}`}
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/problems/${encodeURIComponent(submission.problem?.slug || submission.problemSlug)}`}
                            className={`font-medium transition ${isDark ? "text-[#f4f4f5] hover:text-[#f59e0b]" : "text-[#111827] hover:text-[#2563eb]"}`}
                          >
                            {submission.problem?.title || submission.problemSlug}
                          </Link>
                          {submission.problem?.difficulty && (
                            <p
                              className={`mt-1 text-xs ${
                                submission.problem.difficulty === "Easy"
                                  ? "text-emerald-500"
                                  : submission.problem.difficulty === "Medium"
                                    ? "text-amber-500"
                                    : "text-red-500"
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
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                            }`}
                          >
                            {submission.verdict}
                          </span>
                        </td>

                        <td className={`px-5 py-4 uppercase ${isDark ? "text-[#d4d4d8]" : "text-[#334155]"}`}>
                          {submission.language === "cpp" ? "C++" : submission.language}
                        </td>

                        <td className={`px-5 py-4 tabular-nums ${isDark ? "text-[#d4d4d8]" : "text-[#334155]"}`}>
                          {submission.passed} / {submission.total}
                        </td>

                        <td className={`px-5 py-4 ${mutedTextClass}`}>
                          {formatDate(submission.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className={`mt-4 text-xs ${subtleTextClass}`}>
              Showing your 100 most recent submissions.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
