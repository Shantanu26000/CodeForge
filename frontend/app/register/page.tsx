
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      setError(
        err instanceof Error ? err.message : "Unable to register."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080b14] px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d1220] p-8 shadow-2xl">
        <Link href="/" className="text-sm text-violet-300 hover:text-violet-200">
          ← Back to CodeForge
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold">
            Create your <span className="text-violet-400">account</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Join CodeForge and start solving problems.
          </p>
        </div>

        <form onSubmit={handleRegister} className="mt-8 space-y-5">
          <div>
            <label htmlFor="username" className="mb-2 block text-sm text-slate-300">
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
              className="w-full rounded-xl border border-slate-700 bg-[#080b14] px-4 py-3 outline-none focus:border-violet-500"
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-slate-700 bg-[#080b14] px-4 py-3 outline-none focus:border-violet-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-slate-300">
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
              className="w-full rounded-xl border border-slate-700 bg-[#080b14] px-4 py-3 outline-none focus:border-violet-500"
              placeholder="At least 8 characters"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
