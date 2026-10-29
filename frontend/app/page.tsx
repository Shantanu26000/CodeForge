"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { getProblems, type Problem } from "./lib/api";

type Difficulty = "Easy" | "Medium" | "Hard";

type StreakStats = {
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  lastSolvedDate: string | null;
};

type UserProgress = {
  totalSubmissions: number;
  acceptedSubmissions: number;
  solvedProblems: number;
  acceptanceRate: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
  const router = useRouter();
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("codeforge-theme");
    const initialTheme = savedTheme === "light" ? "light" : "dark";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("codeforge-theme", nextTheme);
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [accountLabel, setAccountLabel] = useState("Guest");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountUsername, setAccountUsername] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");

  function readAccountDetails(token: string | null) {
    if (!token) {
      return { name: "Guest", username: "", email: "" };
    }

    // The login API returns a user object as well as a JWT. Read that saved
    // object first; older sessions may only have the token saved.
    for (const key of ["user", "codeforge-user", "currentUser"]) {
      try {
        const rawUser = localStorage.getItem(key);
        if (!rawUser) continue;
        const user = JSON.parse(rawUser);
        const username = typeof user.username === "string" ? user.username : "";
        const email = typeof user.email === "string" ? user.email : "";
        const emailName = email.includes("@") ? email.split("@")[0] : "";
        const name = typeof user.name === "string" && user.name.trim()
          ? user.name.trim()
          : username || emailName;
        if (name || username || email) {
          return { name: name || "CodeForge member", username, email };
        }
      } catch {
        // Ignore malformed cached profile data and try the next source.
      }
    }

    try {
      const payloadPart = token.split(".")[1];
      if (payloadPart) {
        const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(normalized));
        const name = payload.name || payload.username || payload.email;
        return {
          name: name || "Profile details unavailable",
          username: payload.username || "",
          email: payload.email || "",
        };
      }
    } catch {
      // Do not treat an unreadable token payload as a profile.
    }

    return { name: "Profile details unavailable", username: "", email: "" };
  }

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [activeNav, setActiveNav] = useState("Problems");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [streak, setStreak] = useState<StreakStats | null>(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState("");

  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(
    new Set()
  );
  const [solvedLoading, setSolvedLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const account = readAccountDetails(token);
    setIsLoggedIn(Boolean(token));
    setAccountLabel(account.name);
    setAccountUsername(account.username);
    setAccountEmail(account.email);
    setAuthChecked(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setAccountLabel("Guest");
    setAccountUsername("");
    setAccountEmail("");
    localStorage.removeItem("user");
    localStorage.removeItem("codeforge-user");
    localStorage.removeItem("currentUser");
    setProgress(null);
    setStreak(null);
    setStreakLoading(false);
    setSolvedProblemIds(new Set());
    setProgressError("Log in to view your progress.");
    setProgressLoading(false);
    setSolvedLoading(false);
    router.push("/login");
  };

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
            err instanceof Error ? err.message : "Unable to load problems."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProblems();

    return () => {
      cancelled = true;
    };
  }, [search, difficulty, reloadKey]);

  useEffect(() => {
    if (!authChecked) return;

    let cancelled = false;

    async function loadProgress() {
      setProgressLoading(true);
      setProgressError("");

      if (!isLoggedIn) {
        setProgress(null);
        setProgressError("Log in to view your progress.");
        setProgressLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setIsLoggedIn(false);
          setProgress(null);
          setProgressError("Log in to view your progress.");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/progress`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          setIsLoggedIn(false);
          setProgress(null);
          setProgressError("Your session expired. Please log in again.");
          return;
        }

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your progress.");
        }

        if (!cancelled) {
          setProgress(data);
        }
      } catch (err) {
        if (!cancelled) {
          setProgress(null);
          setProgressError(
            err instanceof Error ? err.message : "Unable to load your progress."
          );
        }
      } finally {
        if (!cancelled) {
          setProgressLoading(false);
        }
      }
    }

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [authChecked, isLoggedIn]);

  useEffect(() => {
    if (!authChecked) return;

    let cancelled = false;

    async function loadSolvedProblems() {
      setSolvedLoading(true);

      if (!isLoggedIn) {
        setSolvedProblemIds(new Set());
        setSolvedLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setIsLoggedIn(false);
          setSolvedProblemIds(new Set());
          return;
        }

        const response = await fetch(`${API_BASE_URL}/progress/solved`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          setIsLoggedIn(false);
          setSolvedProblemIds(new Set());
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load solved problems."
          );
        }

        if (!cancelled) {
          setSolvedProblemIds(new Set<string>(data.solvedProblems ?? []));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Solved problems error:", err);
          setSolvedProblemIds(new Set());
        }
      } finally {
        if (!cancelled) {
          setSolvedLoading(false);
        }
      }
    }

    loadSolvedProblems();

    return () => {
      cancelled = true;
    };
  }, [authChecked, isLoggedIn]);

  useEffect(() => {
    if (!authChecked) return;

    let cancelled = false;

    async function loadStreak() {
      if (!isLoggedIn) {
        setStreak(null);
        setStreakLoading(false);
        return;
      }

      setStreakLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setStreak(null);
          setStreakLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/submissions/streak`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load streak.");
        }

        if (!cancelled) setStreak(data);
      } catch (err) {
        if (!cancelled) {
          console.error("Streak loading error:", err);
          setStreak(null);
        }
      } finally {
        if (!cancelled) setStreakLoading(false);
      }
    }

    loadStreak();
    return () => {
      cancelled = true;
    };
  }, [authChecked, isLoggedIn]);

  const counts = {
    Easy: problems.filter((p) => p.difficulty === "Easy").length,
    Medium: problems.filter((p) => p.difficulty === "Medium").length,
    Hard: problems.filter((p) => p.difficulty === "Hard").length,
  };

  const sidebar = (
    <>
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--foreground)] shadow-lg shadow-black/20">
          <Code2 size={23} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--foreground)]">
            CodeForge<span className="text-[var(--accent)]">.</span>
          </h1>
          <p className="text-xs text-[var(--muted)]">Learn. Solve. Level up.</p>
        </div>
      </div>

      <div className="px-4 pt-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
          Workspace
        </p>

        <nav className="space-y-1">
          {navItems.map(({ label, icon: Icon }) => (
            <Link
              key={label}
              href={
                label === "Submissions"
                  ? isLoggedIn
                    ? "/history"
                    : "/login?redirect=/history"
                  : "/"
              }
              onClick={(event) => {
                if (label !== "Submissions") event.preventDefault();
                setActiveNav(label);
                setMobileMenuOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                activeNav === label
                  ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                  : "text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon size={18} />
              {label}
              {label === "Problems" && (
                <span className="ml-auto rounded-md bg-[var(--surface-elevated)] px-2 py-0.5 text-xs text-[var(--foreground)]">
                  {total}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto px-4 pb-5">
        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent-soft)] to-[var(--surface)] p-4">
          <div className="mb-3 flex items-center gap-2 text-[var(--accent)]">
            <Zap size={17} />
            <span className="text-xs font-semibold">
              Keep the streak alive
            </span>
          </div>
          <p className="text-xs leading-5 text-[var(--muted)]">
            {streakLoading
              ? "Loading your streak…"
              : !isLoggedIn
                ? "Log in to track your streak."
                : `${streak?.currentStreak ?? 0} day current streak · ${streak?.longestStreak ?? 0} day best`}
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{
                width: `${Math.min(100, ((streak?.currentStreak ?? 0) % 7) / 7 * 100)}%`,
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[var(--muted)]">
            {isLoggedIn
              ? `${streak?.activeDays ?? 0} active days · Solve today to keep it going`
              : "Start your coding journey"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveNav("Settings");
            setMobileMenuOpen(false);
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[var(--muted)] transition hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
        >
          <Settings size={18} />
          Settings
        </button>

        <div className="mt-4 flex items-center gap-3 border-t border-[var(--border)] pt-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--secondary-accent)] text-sm font-bold text-[var(--foreground)]">
            CF
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              {accountLabel}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {!authChecked ? "Checking session…" : isLoggedIn ? "Signed in" : "Guest session"}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex">
        {sidebar}
      </aside>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-transform lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
          className="absolute right-4 top-6 rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-elevated)]"
        >
          <X size={20} />
        </button>
        {sidebar}
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--surface-elevated)] lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div className="hidden items-center gap-2 text-sm text-[var(--muted)] sm:flex">
              Workspace <ChevronRight size={14} />
              <span className="font-medium text-[var(--foreground)]">{activeNav}</span>
            </div>

            <span className="text-sm font-semibold text-[var(--foreground)] sm:hidden">
              {activeNav}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              <span className="hidden sm:inline">
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </span>
            </button>

            <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-[var(--muted)]">Platform online</span>
            </div>

            {!authChecked ? null : isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-rose-500"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--accent-hover)]"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </header>

        {activeNav === "Settings" ? (
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-10">
            <div className="mb-8">
              <p className="text-sm font-semibold text-[var(--accent)]">PREFERENCES</p>
              <h2 className="mt-2 text-3xl font-bold">Settings</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">Manage your appearance, account session, and security options.</p>
            </div>
            {settingsMessage && <p role="status" className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">{settingsMessage}</p>}
            <section className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-[var(--accent-soft)] p-3 text-[var(--accent)]"><Sun size={20} /></div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">Appearance</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">Choose the theme used across CodeForge. Your choice is saved in this browser.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => { if (theme !== "light") toggleTheme(); setSettingsMessage("Light theme selected."); }} className={`rounded-xl border px-4 py-2 text-sm ${theme === "light" ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--accent)]"}`}>Light theme</button>
                    <button type="button" onClick={() => { if (theme !== "dark") toggleTheme(); setSettingsMessage("Dark theme selected."); }} className={`rounded-xl border px-4 py-2 text-sm ${theme === "dark" ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border)] hover:border-[var(--accent)]"}`}>Dark theme</button>
                  </div>
                </div>
              </div>
            </section>
            <section className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-[var(--accent-soft)] p-3 text-[var(--accent)]"><Settings size={20} /></div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">Account</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[var(--border)] p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Display name</p>
                      <p className="mt-1 break-words font-semibold text-[var(--foreground)]">{!authChecked ? "Loading…" : accountLabel}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Email address</p>
                      <p className="mt-1 break-words font-semibold text-[var(--foreground)]">{isLoggedIn ? accountEmail || "Not available in this session" : "—"}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Username</p>
                      <p className="mt-1 break-words font-semibold text-[var(--foreground)]">{isLoggedIn ? accountUsername || accountLabel : "—"}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--border)] p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">Session status</p>
                      <p className="mt-1 font-semibold text-[var(--foreground)]">{!authChecked ? "Checking session…" : isLoggedIn ? "Signed in" : "Guest session"}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {isLoggedIn ? <button type="button" onClick={handleLogout} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500">Log out</button> : <Link href="/login" className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">Log in</Link>}
                    {!isLoggedIn && <Link href="/register" className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]">Create account</Link>}
                  </div>
                </div>
              </div>
            </section>
            <section className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-[var(--accent-soft)] p-3 text-[var(--accent)]"><History size={20} /></div>
                <div className="flex-1">
                  <h3 className="font-semibold">Progress and submissions</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">Review your past code submissions and verdicts.</p>
                  <Link href={isLoggedIn ? "/history" : "/login?redirect=/history"} className="mt-4 inline-flex rounded-xl border border-[var(--border)] px-4 py-2 text-sm hover:border-[var(--accent)]">Open submission history <ArrowUpRight size={15} className="ml-2" /></Link>
                </div>
              </div>
            </section>
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
              <h3 className="font-semibold">Security</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Email OTP verification, OTP login, and password recovery are planned for the next authentication phase. They are not enabled yet.</p>
            </section>
          </div>
        ) : activeNav === "Contests" ? (
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
            <div className="mb-8 rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent-soft)] to-[var(--surface)] p-6 sm:p-9">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]"><Trophy size={14} /> CONTEST ARENA</div>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Think fast. Code smart.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Contest mode will have timed rounds, a dedicated problem set, and a leaderboard. The current backend does not yet expose contest schedules or contest submissions, so we won't show fake upcoming events.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="mb-4 inline-flex rounded-xl bg-[var(--accent-soft)] p-3 text-[var(--accent)]"><BookOpen size={22} /></div>
                <h3 className="text-lg font-semibold">Practice while we build contests</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Use the existing problem library to practice algorithms and test your solutions with Run and Submit.</p>
                <button type="button" onClick={() => setActiveNav("Problems")} className="mt-5 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">Browse problems</button>
              </section>
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="mb-4 inline-flex rounded-xl bg-[var(--accent-soft)] p-3 text-[var(--accent)]"><Trophy size={22} /></div>
                <h3 className="text-lg font-semibold">What contest mode will include</h3>
                <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]"><li>• Timed rounds and start/end times</li><li>• Contest-specific problem sets</li><li>• Live standings and submission penalties</li><li>• Past contest history</li></ul>
              </section>
            </div>
          </div>
        ) : (
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 sm:py-10">
          <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-medium text-[var(--accent)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                YOUR CODING JOURNEY STARTS HERE
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
                {activeNav === "Dashboard" ? <>Your <span className="text-[var(--accent)]">Dashboard</span></> : <>Problem <span className="text-[var(--accent)]">Library</span></>}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                Sharpen your skills, master algorithms, and become a better
                problem solver one challenge at a time.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Practice at your own pace
            </div>
          </section>

          {activeNav === "Dashboard" && (
            <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold">Pick up where you left off</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">Track accepted solutions here, then open the problem library when you're ready for another challenge.</p>
                </div>
                <button type="button" onClick={() => setActiveNav("Problems")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">Explore problems <ArrowUpRight size={16} /></button>
              </div>
            </section>
          )}

          <section className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)] sm:text-sm">
                  Total problems
                </span>
                <div className="rounded-lg bg-[var(--accent-soft)] p-2 text-[var(--accent)]">
                  <BookOpen size={17} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-[var(--foreground)]">{total}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Published challenges
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)] sm:text-sm">Solved</span>
                <div className="rounded-lg bg-emerald-400/10 p-2 text-emerald-400">
                  <CheckCircle2 size={17} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-[var(--foreground)]">
                {!authChecked || (isLoggedIn && progressLoading)
                  ? "..."
                  : isLoggedIn
                    ? progress?.solvedProblems ?? "—"
                    : "—"}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {isLoggedIn
                  ? progressError || "Unique problems accepted"
                  : "Log in to view your progress"}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)] sm:text-sm">
                  Easy problems
                </span>
                <div className="rounded-lg bg-emerald-400/10 p-2 text-emerald-400">
                  <Circle size={17} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-[var(--foreground)]">{counts.Easy}</p>
              <p className="mt-1 text-xs text-emerald-400">
                Build your foundations
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--muted)] sm:text-sm">
                  Acceptance rate
                </span>
                <div className="rounded-lg bg-[var(--accent-soft)] p-2 text-[var(--accent)]">
                  <Zap size={17} />
                </div>
              </div>
              <p className="mt-4 text-2xl font-bold text-[var(--foreground)]">
                {!authChecked || (isLoggedIn && progressLoading)
                  ? "..."
                  : isLoggedIn && progress
                    ? `${progress.acceptanceRate}%`
                    : "—"}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {!isLoggedIn
                  ? "Log in to view your progress"
                  : progress
                    ? `${progress.acceptedSubmissions} accepted of ${progress.totalSubmissions} submissions`
                    : progressError || "Your submission success rate"}
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)] p-4 sm:p-6">
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    {activeNav === "Dashboard" ? "Your practice overview" : "All Problems"}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {activeNav === "Dashboard" ? "Your progress at a glance. Use Problems to browse and filter the full library." : "Explore challenges and track your progress."}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-0 sm:w-72">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                    />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search problems or topics..."
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-2.5 pl-10 pr-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                    />
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3">
                    <SlidersHorizontal
                      size={15}
                      className="text-[var(--muted)]"
                    />
                    <select
                      value={difficulty}
                      onChange={(event) => setDifficulty(event.target.value)}
                      className="w-full bg-transparent py-2.5 text-sm text-[var(--foreground)] outline-none"
                    >
                      <option className="bg-[var(--surface)]" value="All">
                        All difficulties
                      </option>
                      <option className="bg-[var(--surface)]" value="Easy">
                        Easy
                      </option>
                      <option className="bg-[var(--surface)]" value="Medium">
                        Medium
                      </option>
                      <option className="bg-[var(--surface)]" value="Hard">
                        Hard
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {["All", "Easy", "Medium", "Hard"].map((level) => (
                  <button
                    type="button"
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                      difficulty === level
                        ? "bg-[var(--accent)] text-[var(--foreground)]"
                        : "border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {level}
                  </button>
                ))}
                <span className="ml-auto self-center text-xs text-[var(--muted)]">
                  {loading ? "Loading..." : `${problems.length} results`}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-[var(--surface-elevated)]">
                  <tr className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                    <th className="px-6 py-4">Status</th>
                    <th className="px-4 py-4">Problem</th>
                    <th className="px-4 py-4">Difficulty</th>
                    <th className="px-4 py-4">Topics</th>
                    <th className="px-6 py-4 text-right">Open</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border)]">
                  {loading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[var(--muted)]">
                        Loading problems...
                      </td>
                    </tr>
                  )}

                  {!loading && error && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-rose-400">
                        {error}
                        <button
                          type="button"
                          onClick={() => setReloadKey((key) => key + 1)}
                          className="ml-2 underline"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    !error &&
                    problems.map((problem) => {
                      const isSolved =
                        authChecked &&
                        isLoggedIn &&
                        solvedProblemIds.has(problem._id);

                      return (
                        <tr
                          key={problem._id}
                          className="group transition hover:bg-[var(--accent-soft)]/40"
                        >
                          <td className="px-6 py-4">
                            {isSolved ? (
                              <div
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400"
                                title="Solved"
                              >
                                <CheckCircle2 size={17} />
                                <span>Solved</span>
                              </div>
                            ) : (
                              <Circle size={17} className="text-[var(--muted)]" />
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <Link
                              href={`/problems/${encodeURIComponent(problem.slug)}`}
                              prefetch={false}
                              className="inline-block cursor-pointer text-sm font-medium text-[var(--foreground)] transition hover:text-[var(--accent)]"
                            >
                              {problem.title}
                            </Link>
                            <p className="mt-1 text-[11px] text-[var(--muted)]">
                              Problem #{problem._id.slice(-6)}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${difficultyStyles[problem.difficulty]}`}
                            >
                              {problem.difficulty}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {problem.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-md border border-[var(--border)] bg-[var(--surface-elevated)] px-2 py-1 text-[11px] text-[var(--muted)]"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/problems/${encodeURIComponent(problem.slug)}`}
                              prefetch={false}
                              aria-label={`Open ${problem.title}`}
                              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] p-2 text-[var(--muted)] transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                            >
                              <ArrowUpRight size={15} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}

                  {!loading && !error && problems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <Search size={26} className="mx-auto text-[var(--muted)]" />
                        <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
                          No problems found
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Try another search term or difficulty.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setDifficulty("All");
                          }}
                          className="mt-4 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent)]"
                        >
                          Clear filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:px-6">
              <p className="text-xs text-[var(--muted)]">
                Showing {problems.length} of {total} problems
              </p>
              <p className="text-xs text-[var(--muted)]">
                CodeForge Problem Library
              </p>
            </div>
          </section>

          <footer className="mt-8 flex flex-col justify-between gap-2 pb-4 text-xs text-[var(--muted)] sm:flex-row">
            <p>© 2026 CodeForge. Built for problem solvers.</p>
            <p>Practice consistently. Progress relentlessly.</p>
          </footer>
        </div>
        )}
      </main>
    </div>
  );
}
