"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDealerAuth } from "@/app/contexts/dealer-auth";

export default function Home() {
  const { dealer, loading } = useDealerAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!dealer) {
      router.replace("/backoffice-login");
      return;
    }

    router.replace(
      dealer.role === "admin" ? "/admin/dashboard" : "/dealer/dashboard",
    );
  }, [dealer, loading, router]);

  // Show spinner while resolving
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
    </div>
  );
}
