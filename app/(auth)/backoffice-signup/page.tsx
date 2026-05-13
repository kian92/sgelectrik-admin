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
  User,
  ShieldCheck,
  Store,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useDealerAuth } from "@/app/contexts/dealer-auth";
import Image from "next/image";

export default function SignUpPage() {
  const router = useRouter();
  const { refresh } = useDealerAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<"dealer" | "admin">("dealer");
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── Password strength ──────────────────────────────────────────────────────
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][score];
  const strengthColor = [
    "",
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-emerald-500",
  ][score];
  const strengthText = [
    "",
    "text-red-500",
    "text-orange-500",
    "text-yellow-500",
    "text-emerald-600",
  ][score];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (score < 2) {
      setError("Please choose a stronger password.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess(true);
  }

  // Replace the success screen
  if (success) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-5">
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Request submitted!
              </h2>
              <p className="text-slate-600 text-sm mb-3">
                Your account request has been sent to our admin team for review.
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                You'll receive an email once your account is approved. This
                usually takes 1–2 business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* ── Brand header ── */}
          <div className="flex flex-col items-center text-center mb-8 leading-tight">
            {/* Logo */}
            <Image
              src="/icon.png"
              alt="SGElectrik"
              width={40}
              height={40}
              className="object-contain mb-2"
            />

            {/* Title */}
            <span className="text-xl font-bold text-white tracking-wide">
              SGELECTRIK.COM
            </span>

            {/* Subtitle */}
            <span className="text-sm text-slate-400">
              {" "}
              Backoffice Management Portal
            </span>
          </div>

          {/* ── Card ── */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h1 className="text-xl font-bold text-slate-900 mb-1">
              Create account
            </h1>
            <p className="text-slate-500 text-sm mb-6">
              Set up your backoffice access below.
            </p>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ── Role selector ── */}
              <div className="hidden">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Account role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("dealer")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      role === "dealer"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    Dealer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      role === "admin"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </button>
                </div>
              </div>

              {/* ── Full name ── */}
              <div>
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-slate-700 mb-1.5 block"
                >
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* ── Email ── */}
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

              {/* ── Password ── */}
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
                    placeholder="Min. 8 characters"
                    required
                    autoComplete="new-password"
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

                {/* Strength meter */}
                {password && (
                  <div className="mt-2.5">
                    <div className="flex gap-1.5 mb-1.5">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i < score ? strengthColor : "bg-slate-100"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-medium ${strengthText}`}>
                        {strengthLabel}
                      </p>
                      <div className="flex gap-3">
                        {(
                          [
                            { key: "length", label: "8+ chars" },
                            { key: "upper", label: "A-Z" },
                            { key: "number", label: "0-9" },
                            { key: "special", label: "!@#" },
                          ] as const
                        ).map(({ key, label }) => (
                          <span
                            key={key}
                            className={`text-xs ${checks[key] ? "text-emerald-600" : "text-slate-300"}`}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Confirm password ── */}
              <div>
                <label
                  htmlFor="confirm"
                  className="text-sm font-medium text-slate-700 mb-1.5 block"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    id="confirm"
                    type={showCp ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    autoComplete="new-password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                      confirm && password !== confirm
                        ? "border-red-300 focus:ring-red-400 bg-red-50"
                        : confirm && password === confirm
                          ? "border-emerald-300 focus:ring-emerald-500 bg-emerald-50"
                          : "border-slate-200 focus:ring-emerald-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCp((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCp ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                  {/* Match icon */}
                  {confirm && (
                    <div className="absolute right-9 top-1/2 -translate-y-1/2">
                      {password === confirm ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-500 mt-1.5">
                    Passwords don't match.
                  </p>
                )}
              </div>

              {/* ── Submit ── */}
              <button
                type="submit"
                disabled={loading}
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
                    Creating account…
                  </span>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            {/* Sign in link */}
            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{" "}
              <Link
                href="/backoffice-login"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Sign in
              </Link>
            </p>
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
