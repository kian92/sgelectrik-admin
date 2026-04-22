"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BatteryCharging,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useDealerAuth } from "@/app/contexts/dealer-auth";

export default function SignInPage() {
  const router = useRouter();
  const { refresh } = useDealerAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [forgotSent, setForgotSent] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.ok) {
      await refresh(); // sync context from DB
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;
      router.push(role === "admin" ? "/admin" : "/dealer");
    } else {
      setError("Invalid email or password. Please try again.");
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dealer" });
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setForgotSent(true);
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* ── Brand header ── */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <BatteryCharging className="h-8 w-8 text-emerald-400" />
              <span className="text-2xl font-bold text-white">SGElectrik</span>
            </div>
            <p className="text-slate-400 text-sm">
              Backoffice Management Portal
            </p>
          </div>

          {/* ── Card ── */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {mode === "login" ? (
              <>
                <h1 className="text-xl font-bold text-slate-900 mb-1">
                  Sign in
                </h1>
                <p className="text-slate-500 text-sm mb-6">
                  Use your backoffice credentials to continue.
                </p>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-slate-700 mb-1.5 block"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@sgelectrik.sg"
                        required
                        autoComplete="email"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-slate-700 mb-1.5 block"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <input
                        id="password"
                        type={showPw ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPw ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Forgot password */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError("");
                        setForgotSent(false);
                      }}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          />
                        </svg>
                        Signing in…
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative my-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-slate-400">
                        or continue with
                      </span>
                    </div>
                  </div>

                  {/* Google */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading || googleLoading}
                    className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-medium text-sm flex items-center justify-center gap-2 transition"
                  >
                    {googleLoading ? (
                      <svg
                        className="animate-spin h-4 w-4 text-slate-500"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    Continue with Google
                  </button>
                </form>

                {/* Demo credentials */}
                <div className="mt-6 hidden p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    Demo credentials
                  </p>
                  <div className="space-y-1 text-xs text-slate-500 font-mono">
                    <div>admin@sgelectrik.sg / Admin@1234</div>
                    <div>dealer@sgelectrik.sg / Dealer@1234</div>
                  </div>
                </div>

                {/* Sign up link */}
                <p className="text-center text-sm text-slate-500 mt-6">
                  Don't have an account?{" "}
                  <Link
                    href="/backoffice-signup"
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Create one
                  </Link>
                </p>
              </>
            ) : (
              /* ── Forgot password ── */
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setForgotSent(false);
                  }}
                  className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1"
                >
                  ← Back to sign in
                </button>

                <h1 className="text-xl font-bold text-slate-900 mb-1">
                  Reset password
                </h1>
                <p className="text-slate-500 text-sm mb-6">
                  Enter your email and we'll send a reset link.
                </p>

                {forgotSent ? (
                  <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-4 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Reset link sent</p>
                      <p className="text-emerald-600 mt-0.5">
                        If <strong>{email}</strong> is registered, you'll
                        receive a password reset email shortly.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleForgot} className="space-y-5">
                    <div>
                      <label
                        htmlFor="forgot-email"
                        className="text-sm font-medium text-slate-700 mb-1.5 block"
                      >
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <input
                          id="forgot-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@sgelectrik.sg"
                          required
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition"
                    >
                      {loading ? "Sending…" : "Send reset link"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>

          {/* Back to site */}
          <p className="text-center text-xs text-slate-500 mt-6">
            <Link href="/" className="hover:text-slate-300 transition-colors">
              ← Back to SGElectrik
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
