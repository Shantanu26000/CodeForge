"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Theme = "dark" | "light";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.errors?.[0]?.msg || "Registration failed."
        );
      }

      setSuccess("Account created successfully. Redirecting to login...");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register.");
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

          <div className="mt-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Create your <span style={{ color: "var(--accent)" }}>account</span>
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              Join CodeForge and start solving problems.
            </p>
          </div>

          <form onSubmit={handleRegister} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={30}
                autoComplete="username"
                className="w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2"
                style={inputStyle}
                placeholder="Choose a username"
              />
            </div>

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
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2"
                style={inputStyle}
                placeholder="At least 8 characters"
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

            {success && (
              <p
                role="status"
                className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600"
              >
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--muted)" }}>
            Already registered?{" "}
            <Link
              href="/login"
              className="font-semibold transition hover:opacity-75"
              style={{ color: "var(--accent)" }}
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
