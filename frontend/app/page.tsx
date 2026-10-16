
"use client";

import { useEffect, useState } from "react";
import {
  Code2,
  LayoutDashboard,
  BookOpen,
  Trophy,
  History,
  Settings,
  Search,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { getProblems, type Problem } from "./lib/api";

type Difficulty = "Easy" | "Medium" | "Hard";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Problems", icon: BookOpen },
  { label: "Contests", icon: Trophy },
  { label: "Submissions", icon: History },
];

const difficultyStyles: Record<Difficulty, string> = {
  Easy: "bg-emerald-400/10 text-emerald-400",
  Medium: "bg-amber-400/10 text-amber-400",
  Hard: "bg-rose-400/10 text-rose-400",
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [activeNav, setActiveNav] = useState("Problems");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProblems() {
      setLoading(true);
      setError("");

      try {
        const data = await getProblems({
          search,
          difficulty,
          page: 1,
          limit: 50,
        });

        if (!cancelled) {
          setProblems(data.problems);
          setTotal(data.pagination.total);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load problems."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProblems();

    return () => {
      cancelled = true;
    };
  }, [search, difficulty]);

  const counts = {
    Easy: problems.filter((p) => p.difficulty === "Easy").length,
    Medium: problems.filter((p) => p.difficulty === "Medium").length,
    Hard: problems.filter((p) => p.difficulty === "Hard").length,
  };

  const sidebar = (
    <>
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-500/20">
          <Code2 size={23} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            CodeForge<span className="text-violet-400">.</span>
          </h1>
          <p className="text-xs text-slate-500">Learn. Solve. Level up.</p>
        </div>
      </div>

      <div className="px-4 pt-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Workspace
        </p>

        <nav className="space-y-1">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                setActiveNav(label);
                setMobileMenuOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                activeNav === label
                  ? "bg-violet-500/15 font-semibold text-violet-300"
                  : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}

              {label === "Problems" && (
                <span className="ml-auto rounded-md bg-slate-700/70 px-2 py-0.5 text-xs text-slate-300">
                  {total}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto px-4 pb-5">
        <div className="mb-4 rounded-2xl border border-violet-400/15 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-violet-300">
            <Zap size={17} />
            <span className="text-xs font-semibold">
              Keep the streak alive
            </span>
          </div>
          <p className="text-xs leading-5 text-slate-400">
            Every problem you solve brings you one step closer to mastery.
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-1/4 rounded-full bg-violet-500" />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Start your coding journey
          </p>
        </div>

        <button
          onClick={() => setActiveNav("Settings")}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          <Settings size={18} />
          Settings
        </button>

        <div className="mt-4 flex items-center gap-3 border-t border-slate-800 pt-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
            CF
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              CodeForge User
            </p>
            <p className="text-xs text-slate-500">Problem solver</p>
          </div>
          <ChevronDown size={16} className="text-slate-500" />
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#080b14] text-slate-200">
      {mobileMenuOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-slate-800/80 bg-[#0b0f1a] lg:flex">
        {sidebar}
      </aside>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-[#0b0f1a] transition-transform lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
          className="absolute right-4 top-6 rounded-lg p-2 text-slate-400 hover:bg-slate-800"
        >
          <X size={20} />
        </button>
        {sidebar}
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-800/80 bg-[#080b14]/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
              Workspace <ChevronRight size={14} />
              <span className="font-medium text-slate-200">
                {activeNav}
              </span>
            </div>

            <span className="text-sm font-semibold text-white sm:hidden">
              {activeNav}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-2 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400">
                Platform online
              </span>
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-sm font-bold text-violet-300">
              CF
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 sm:py-10">
          <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/5 px-3 py-1.5 text-xs font-medium text-violet-300">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                YOUR CODING JOURNEY STARTS HERE
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Problem <span className="text-violet-400">Library</span>
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
                Sharpen your skills, master algorithms, and become a better
                problem solver one challenge at a time.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Practice at your own pace
            </div>
          </section>

          <section className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-[#0d1220] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 sm:text-sm">
                  Total problems
                </span>
                <div className="rounded-lg bg-violet-400/10 p-2 text-violet-300">
                  <BookOpen size={17} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-white">{total}</p>
              <p className="mt-1 text-xs text-slate-500">
                Published challenges
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0d1220] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 sm:text-sm">
                  Solved
                </span>
                <div className="rounded-lg bg-emerald-400/10 p-2 text-emerald-400">
                  <CheckCircle2 size={17} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-white">0</p>
              <p className="mt-1 text-xs text-slate-500">
                Submission tracking coming soon
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0d1220] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 sm:text-sm">
                  Easy problems
                </span>
                <div className="rounded-lg bg-emerald-400/10 p-2 text-emerald-400">
                  <Circle size={17} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-white">
                {counts.Easy}
              </p>
              <p className="mt-1 text-xs text-emerald-400">
                Build your foundations
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0d1220] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 sm:text-sm">
                  Hard problems
                </span>
                <div className="rounded-lg bg-rose-400/10 p-2 text-rose-400">
                  <Zap size={17} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-white">
                {counts.Hard}
              </p>
              <p className="mt-1 text-xs text-rose-300">
                Challenge yourself
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1220]">
            <div className="border-b border-slate-800 p-4 sm:p-6">
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    All Problems
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Explore challenges and track your progress.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-0 sm:w-72">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search problems or topics..."
                      className="w-full rounded-xl border border-slate-700 bg-[#080b14] py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-[#080b14] px-3">
                    <SlidersHorizontal
                      size={15}
                      className="text-slate-400"
                    />
                    <select
                      value={difficulty}
                      onChange={(event) => setDifficulty(event.target.value)}
                      className="w-full bg-transparent py-2.5 text-sm text-slate-300 outline-none"
                    >
                      <option className="bg-[#0d1220]" value="All">
                        All difficulties
                      </option>
                      <option className="bg-[#0d1220]" value="Easy">
                        Easy
                      </option>
                      <option className="bg-[#0d1220]" value="Medium">
                        Medium
                      </option>
                      <option className="bg-[#0d1220]" value="Hard">
                        Hard
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {["All", "Easy", "Medium", "Hard"].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                      difficulty === level
                        ? "bg-violet-500 text-white"
                        : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {level}
                  </button>
                ))}

                <span className="ml-auto self-center text-xs text-slate-500">
                  {loading ? "Loading..." : `${problems.length} results`}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-slate-900/40">
                  <tr className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                    <th className="px-6 py-4">Status</th>
                    <th className="px-4 py-4">Problem</th>
                    <th className="px-4 py-4">Difficulty</th>
                    <th className="px-4 py-4">Topics</th>
                    <th className="px-6 py-4 text-right">Open</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/80">
                  {loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-400"
                      >
                        Loading problems...
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-rose-400"
                      >
                        {error}
                        <button
                          onClick={() => {
                            setSearch((current) => current);
                          }}
                          className="ml-2 underline"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    problems.map((problem) => (
                      <tr
                        key={problem._id}
                        className="group transition hover:bg-violet-400/[0.035]"
                      >
                        <td className="px-6 py-4">
                          <Circle size={17} className="text-slate-600" />
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-slate-200 transition group-hover:text-violet-300">
                            {problem.title}
                          </div>
                          <p className="mt-1 text-[11px] text-slate-600">
                            Problem #{problem._id.slice(-6)}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${
                              difficultyStyles[problem.difficulty]
                            }`}
                          >
                            {problem.difficulty}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {problem.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-md border border-slate-800 bg-slate-900/70 px-2 py-1 text-[11px] text-slate-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            aria-label={`Open ${problem.title}`}
                            onClick={() => {
                              window.location.href = `/problems/${problem.slug}`;
                            }}
                            className="inline-flex rounded-lg border border-slate-800 p-2 text-slate-500 transition hover:border-violet-400/30 hover:bg-violet-400/10 hover:text-violet-300"
                          >
                            <ArrowUpRight size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}

                  {!loading && !error && problems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <Search
                          size={26}
                          className="mx-auto text-slate-600"
                        />
                        <p className="mt-3 text-sm font-medium text-slate-300">
                          No problems found
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Try another search term or difficulty.
                        </p>
                        <button
                          onClick={() => {
                            setSearch("");
                            setDifficulty("All");
                          }}
                          className="mt-4 text-xs font-medium text-violet-300 hover:text-violet-200"
                        >
                          Clear filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <p className="text-xs text-slate-500">
                Showing {problems.length} of {total} problems
              </p>
              <p className="text-xs text-slate-600">
                CodeForge Problem Library
              </p>
            </div>
          </section>

          <footer className="mt-8 flex flex-col justify-between gap-2 pb-4 text-xs text-slate-600 sm:flex-row">
            <p>© 2026 CodeForge. Built for problem solvers.</p>
            <p>Practice consistently. Progress relentlessly.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
