"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function DealerError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
      <h2 className="text-lg font-semibold text-slate-900 mb-1">
        This page couldn't load
      </h2>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">
        Something went wrong while loading your dashboard. This can happen
        right after signing in — try again in a moment.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => unstable_retry()}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition"
        >
          Try again
        </button>
        <Link
          href="/backoffice-login"
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
