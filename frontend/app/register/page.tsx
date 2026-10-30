"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Sun, Mail, ShieldCheck } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Theme = "dark" | "light";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"register" | "verify">("register");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
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

  async function readResponse(response: Response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.errors?.[0]?.msg || "Request failed.");
    }
    return data;
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
      const data = await readResponse(response);
      setStep("verify");
      setSuccess(data.message || "OTP sent. Check your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await readResponse(response);
      if (!data.token) throw new Error("Email verified, but no login token was returned.");
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      setSuccess("Email verified! Redirecting to CodeForge...");
      setTimeout(() => router.push("/"), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setSuccess("");
    setResending(true);
    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await readResponse(response);
      setSuccess(data.message || "A new OTP has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend OTP.");
    } finally {
      setResending(false);
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

        <div className="rounded-2xl border p-8 shadow-2xl transition-colors duration-200" style={cardStyle}>
          <Link href="/" className="text-sm font-medium transition hover:opacity-75" style={{ color: "var(--accent)" }}>
            ← Back to CodeForge
          </Link>

          <div className="mt-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--background)", color: "var(--accent)" }}>
              {step === "register" ? <Mail size={21} /> : <ShieldCheck size={21} />}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {step === "register" ? <>Create your <span style={{ color: "var(--accent)" }}>account</span></> : <>Verify your <span style={{ color: "var(--accent)" }}>email</span></>}
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              {step === "register"
                ? "Join CodeForge and start solving problems."
                : `Enter the 6-digit code sent to ${email}. The code expires in 10 minutes.`}
            </p>
          </div>

          {step === "register" ? (
            <form onSubmit={handleRegister} className="mt-8 space-y-5">
              <div>
                <label htmlFor="username" className="mb-2 block text-sm font-medium">Username</label>
                <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={30} autoComplete="username" className="w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2" style={inputStyle} placeholder="Choose a username" />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2" style={inputStyle} placeholder="you@example.com" />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2" style={inputStyle} placeholder="At least 8 characters" />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: "var(--accent)" }}>
                {loading ? "Sending OTP..." : "Create Account & Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="mt-8 space-y-5">
              <div>
                <label htmlFor="otp" className="mb-2 block text-sm font-medium">Email OTP</label>
                <input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required className="w-full rounded-xl border px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none transition focus:ring-2" style={inputStyle} placeholder="000000" />
              </div>
              <button type="submit" disabled={loading || otp.length !== 6} className="w-full rounded-xl px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: "var(--accent)" }}>
                {loading ? "Verifying..." : "Verify Email"}
              </button>
              <button type="button" onClick={handleResend} disabled={resending} className="w-full rounded-xl border px-4 py-3 text-sm font-semibold transition hover:opacity-80 disabled:opacity-60" style={cardStyle}>
                {resending ? "Resending..." : "Resend OTP"}
              </button>
              <button type="button" onClick={() => { setStep("register"); setOtp(""); setError(""); setSuccess(""); }} className="w-full text-sm hover:underline" style={{ color: "var(--muted)" }}>
                Back to registration
              </button>
            </form>
          )}

          {error && <p role="alert" className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</p>}
          {success && <p role="status" className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600">{success}</p>}

          <p className="mt-6 text-center text-sm" style={{ color: "var(--muted)" }}>
            Already registered?{" "}
            <Link href="/login" className="font-semibold transition hover:opacity-75" style={{ color: "var(--accent)" }}>Login</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
