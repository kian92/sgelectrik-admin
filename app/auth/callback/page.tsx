"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BatteryCharging } from "lucide-react";

/**
 * /auth/callback
 *
 * Landing page after Google OAuth completes.
 * Waits for the session to be populated, then
 * redirects to the correct dashboard based on role.
 */
export default function AuthCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/backoffice-login");
      return;
    }

    if (status === "authenticated") {
      const role = session?.user?.role;
      router.replace(
        role === "admin" ? "/admin/dashboard" : "/dealer/dashboard",
      );
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex flex-col items-center gap-4">
        <BatteryCharging className="h-10 w-10 text-emerald-400 animate-pulse" />
        <p className="text-slate-400 text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
