"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

export default function SendButton({ id }: { id: string }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [queued, setQueued] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!queued) return;
    const interval = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(interval);
  }, [queued, router]);

  async function handleSend() {
    setSending(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/newsletter/${id}/send`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to queue newsletter.");
        return;
      }

      setQueued(true);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Network error — please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSend}
        disabled={sending || queued}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {queued
          ? "Sending in background..."
          : sending
            ? "Queuing..."
            : "Send Newsletter"}
      </button>
      {queued && (
        <p className="text-xs text-slate-500">
          Emails are being sent in the background. This page updates
          automatically.
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
