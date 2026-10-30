"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Theme = "dark" | "light";
type Mode = "password" | "loginOtpRequest" | "loginOtpVerify" | "forgotRequest" | "forgotReset";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [mode, setMode] = useState<Mode>("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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

  function showMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setMessage("");
    setOtp("");
    setNewPassword("");
  }

  async function postAuth(path: string, payload: Record<string, string>) {
    const response = await fetch(`${API_URL}/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || data.errors?.[0]?.msg || "Request failed."
      );
    }

    return data;
  }

  function saveSession(data: any) {
    const token = data.token || data.accessToken;
    if (!token) {
      throw new Error("Authentication succeeded, but the server did not return a token.");
    }

    localStorage.setItem("token", token);

    if (data.user && typeof data.user === "object") {
      localStorage.setItem("codeforge-user", JSON.stringify(data.user));
    } else {
      localStorage.removeItem("codeforge-user");
    }

    router.push("/");
  }

  async function handlePasswordLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await postAuth("login", { email, password });
      saveSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestLoginOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await postAuth("request-login-otp", { email });
      setMessage(data.message || "If the account is eligible, a login OTP has been sent.");
      showMode("loginOtpVerify");
      setMessage(data.message || "If the account is eligible, a login OTP has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request login OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyLoginOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await postAuth("verify-login-otp", { email, otp });
      saveSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify login OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await postAuth("forgot-password", { email });
      showMode("forgotReset");
      setMessage(data.message || "If the account exists, a password reset OTP has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request password reset.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await postAuth("reset-password", { email, otp, newPassword });
      setMessage(data.message || "Password reset successfully. You can now log in.");
      setPassword("");
      setOtp("");
      setNewPassword("");
      setMode("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password.");
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

  const inputClass =
    "w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2";

  const title =
    mode === "password"
      ? "Welcome back"
      : mode === "loginOtpRequest"
        ? "Login with email OTP"
        : mode === "loginOtpVerify"
          ? "Verify login OTP"
          : mode === "forgotRequest"
            ? "Forgot password"
            : "Reset password";

  const description =
    mode === "password"
      ? "Log in to continue your coding journey."
      : mode === "loginOtpRequest"
        ? "We'll email you a one-time password to log in."
        : mode === "loginOtpVerify"
          ? `Enter the 6-digit code sent to ${email}.`
          : mode === "forgotRequest"
            ? "Enter your account email to receive a password reset OTP."
            : `Enter the OTP sent to ${email} and choose a new password.`;

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
            {title.split(" ").slice(0, -1).join(" ")}{" "}
            <span style={{ color: "var(--accent)" }}>
              {title.split(" ").slice(-1)}
            </span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {description}
          </p>

          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inputClass}
                  style={inputStyle}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          )}

          {mode === "loginOtpRequest" && (
            <form onSubmit={handleRequestLoginOtp} className="mt-8 space-y-5">
              <EmailField email={email} setEmail={setEmail} inputClass={inputClass} inputStyle={inputStyle} />
              <SubmitButton loading={loading} label="Send login OTP" />
            </form>
          )}

          {mode === "loginOtpVerify" && (
            <form onSubmit={handleVerifyLoginOtp} className="mt-8 space-y-5">
              <OtpField otp={otp} setOtp={setOtp} inputClass={inputClass} inputStyle={inputStyle} />
              <SubmitButton loading={loading} label="Verify OTP and login" />
            </form>
          )}

          {mode === "forgotRequest" && (
            <form onSubmit={handleForgotPassword} className="mt-8 space-y-5">
              <EmailField email={email} setEmail={setEmail} inputClass={inputClass} inputStyle={inputStyle} />
              <SubmitButton loading={loading} label="Send password reset OTP" />
            </form>
          )}

          {mode === "forgotReset" && (
            <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
              <OtpField otp={otp} setOtp={setOtp} inputClass={inputClass} inputStyle={inputStyle} />
              <div>
                <label htmlFor="newPassword" className="mb-2 block text-sm font-medium">
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={inputClass}
                  style={inputStyle}
                  placeholder="At least 8 characters"
                />
              </div>
              <SubmitButton loading={loading} label="Reset password" />
            </form>
          )}

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="mt-5 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-600"
            >
              {message}
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
            {mode !== "password" && (
              <button
                type="button"
                onClick={() => showMode("password")}
                className="font-semibold transition hover:opacity-75"
                style={{ color: "var(--accent)" }}
              >
                Back to password login
              </button>
            )}
            {mode === "password" && (
              <>
                <button
                  type="button"
                  onClick={() => showMode("loginOtpRequest")}
                  className="font-semibold transition hover:opacity-75"
                  style={{ color: "var(--accent)" }}
                >
                  Login with OTP
                </button>
                <button
                  type="button"
                  onClick={() => showMode("forgotRequest")}
                  className="font-semibold transition hover:opacity-75"
                  style={{ color: "var(--accent)" }}
                >
                  Forgot password?
                </button>
              </>
            )}
            {mode === "loginOtpVerify" && (
              <button
                type="button"
                onClick={() => showMode("loginOtpRequest")}
                className="font-semibold transition hover:opacity-75"
                style={{ color: "var(--accent)" }}
              >
                Request another OTP
              </button>
            )}
            {mode === "forgotReset" && (
              <button
                type="button"
                onClick={() => showMode("forgotRequest")}
                className="font-semibold transition hover:opacity-75"
                style={{ color: "var(--accent)" }}
              >
                Request another reset OTP
              </button>
            )}
          </div>

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

function EmailField({
  email,
  setEmail,
  inputClass,
  inputStyle,
}: {
  email: string;
  setEmail: (value: string) => void;
  inputClass: string;
  inputStyle: React.CSSProperties;
}) {
  return (
    <div>
      <label htmlFor="email" className="mb-2 block text-sm font-medium">
        Email
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        className={inputClass}
        style={inputStyle}
        placeholder="you@example.com"
      />
    </div>
  );
}

function OtpField({
  otp,
  setOtp,
  inputClass,
  inputStyle,
}: {
  otp: string;
  setOtp: (value: string) => void;
  inputClass: string;
  inputStyle: React.CSSProperties;
}) {
  return (
    <div>
      <label htmlFor="otp" className="mb-2 block text-sm font-medium">
        6-digit OTP
      </label>
      <input
        id="otp"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        required
        autoComplete="one-time-code"
        className={`${inputClass} text-center tracking-[0.5em]`}
        style={inputStyle}
        placeholder="••••••"
      />
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      style={{ backgroundColor: "var(--accent)" }}
    >
      {loading ? "Please wait..." : label}
    </button>
  );
}
