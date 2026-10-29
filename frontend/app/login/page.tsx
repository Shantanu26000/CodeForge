"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Theme = "dark" | "light";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("codeforge-theme");
    const initialTheme: Theme = savedTheme === "light" ? "light" : "dark";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("codeforge-theme", nextTheme);
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.errors?.[0]?.msg || "Login failed."
        );
      }

      const token = data.token || data.accessToken;

      if (!token) {
        throw new Error("Login succeeded, but the server did not return a token.");
      }

      localStorage.setItem("token", token);

      // The backend login endpoint returns the authenticated user's profile.
      // Save it so the Settings page can display real account details.
      if (data.user && typeof data.user === "object") {
        localStorage.setItem("codeforge-user", JSON.stringify(data.user));
      } else {
        localStorage.removeItem("codeforge-user");
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setLoading(false);
    }
  }

  const pageStyle = {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
  } as const;

  const cardStyle = {
    backgroundColor: "var(--surface)",
    borderColor: "var(--border)",
  } as const;

  const inputStyle = {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    borderColor: "var(--border)",
  } as const;

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4 py-10 transition-colors duration-200"
      style={pageStyle}
    >
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition hover:opacity-80"
            style={cardStyle}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>

        <div
          className="rounded-2xl border p-8 shadow-2xl transition-colors duration-200"
          style={cardStyle}
        >
          <Link
            href="/"
            className="text-sm font-medium transition hover:opacity-75"
            style={{ color: "var(--accent)" }}
          >
            ← Back to CodeForge
          </Link>

          <h1 className="mt-6 text-3xl font-bold tracking-tight">
            Welcome <span style={{ color: "var(--accent)" }}>back</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Log in to continue your coding journey.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2"
                style={inputStyle}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2"
                style={inputStyle}
                placeholder="Your password"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--muted)" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold transition hover:opacity-75"
              style={{ color: "var(--accent)" }}
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
