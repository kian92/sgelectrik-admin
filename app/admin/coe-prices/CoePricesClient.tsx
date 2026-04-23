"use client";

// app/admin/coe-prices/CoePricesClient.tsx

import { useState, useCallback } from "react";
import { Calendar, CheckCircle2, Pencil, X, Save, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CoePrice {
  id: number;
  cat: string;
  label: string;
  description: string;
  price: number;
  ev_relevant: boolean;
  ev_note: string;
  updated_at: string;
}

interface CoeForm {
  price: string;
  description: string;
  ev_note: string;
  ev_relevant: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, { card: string; badge: string }> = {
  A: {
    card: "border-emerald-200 bg-emerald-50/40",
    badge: "bg-emerald-100 text-emerald-700",
  },
  B: {
    card: "border-blue-200 bg-blue-50/40",
    badge: "bg-blue-100 text-blue-700",
  },
  C: {
    card: "border-slate-200 bg-slate-50/40",
    badge: "bg-slate-100 text-slate-600",
  },
  D: {
    card: "border-slate-200 bg-slate-50/40",
    badge: "bg-slate-100 text-slate-600",
  },
  E: {
    card: "border-purple-200 bg-purple-50/40",
    badge: "bg-purple-100 text-purple-700",
  },
};
const fallback = {
  card: "border-slate-200 bg-slate-50/40",
  badge: "bg-slate-100 text-slate-600",
};

const fmt = (p: number) => "$" + p.toLocaleString("en-SG");
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function toForm(c: CoePrice): CoeForm {
  return {
    price: String(c.price),
    description: c.description,
    ev_note: c.ev_note,
    ev_relevant: c.ev_relevant,
  };
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function EditModal({
  coe,
  onClose,
  onSaved,
}: {
  coe: CoePrice;
  onClose: () => void;
  onSaved: () => void;
}) {
  const colors = CAT_COLORS[coe.cat] ?? fallback;
  const [form, setForm] = useState<CoeForm>(toForm(coe));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof CoeForm>(field: K, value: CoeForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseInt(form.price.replace(/[^0-9]/g, ""));
    if (isNaN(p) || p < 0) {
      setError("Price must be a valid number");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/coe-prices/${coe.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: p,
          description: form.description.trim(),
          ev_note: form.ev_note.trim(),
          ev_relevant: form.ev_relevant,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${colors.badge}`}
            >
              <span className="text-sm font-bold">{coe.cat}</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900">
              Edit {coe.label}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Field label="COE Price (S$) — current winning bid">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                $
              </span>
              <input
                className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 font-mono"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="96001"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Enter the latest COE closing price from LTA&apos;s bidding
              exercise
            </p>
          </Field>

          <Field label="Category Description">
            <input
              className={inputCls}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>

          <div className="flex items-center gap-3">
            <input
              id="ev-relevant"
              type="checkbox"
              checked={form.ev_relevant}
              onChange={(e) => set("ev_relevant", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="ev-relevant" className="text-sm text-slate-700">
              Relevant to EV buyers
            </label>
          </div>

          {form.ev_relevant && (
            <Field label="EV Note">
              <input
                className={inputCls}
                value={form.ev_note}
                onChange={(e) => set("ev_note", e.target.value)}
                placeholder="e.g. Applies to most EVs in Singapore"
              />
            </Field>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Price
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Client Component ─────────────────────────────────────────────────────────

export default function CoePricesClient({
  initialCategories,
}: {
  initialCategories: CoePrice[];
}) {
  const [categories, setCategories] = useState<CoePrice[]>(initialCategories);
  const [editing, setEditing] = useState<CoePrice | null>(null);

  // Re-fetch after a save to get fresh data
  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/coe-prices");
      const data = await res.json();
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const evCategories = categories.filter((c) => c.ev_relevant);

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">COE Prices</h1>
          <p className="text-slate-500 text-sm mt-1">
            Update the latest Certificate of Entitlement closing prices after
            each LTA bidding exercise
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-2 my-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <Calendar className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          COE prices are updated by LTA twice a month (1st and 3rd Monday).
          Click <strong>Edit</strong> on any category to update its price after
          each bidding round.
        </p>
      </div>

      <div className="space-y-4">
        {/* EV-relevant highlight cards */}
        {evCategories.length > 0 && (
          <div className="mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              EV-Relevant Categories
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {evCategories.map((c) => {
                const colors = CAT_COLORS[c.cat] ?? fallback;
                return (
                  <div
                    key={c.id}
                    className={`rounded-xl border p-5 shadow-sm ${colors.card}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center ${colors.badge}`}
                        >
                          <span className="text-base font-bold">{c.cat}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {c.label}
                          </p>
                          <p className="text-xs text-slate-500">
                            {c.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditing(c)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-white/60 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-bold text-slate-900">
                          {fmt(c.price)}
                        </p>
                        {c.ev_note && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            <p className="text-xs text-emerald-700">
                              {c.ev_note}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Updated {fmtDate(c.updated_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All categories list */}
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          All Categories
        </p>
        {categories.map((c) => {
          const colors = CAT_COLORS[c.cat] ?? fallback;
          return (
            <div
              key={c.id}
              className="rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.badge}`}
                  >
                    <span className="text-lg font-bold">{c.cat}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-900">
                        {c.label}
                      </h3>
                      {c.ev_relevant && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> EV Relevant
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{c.description}</p>
                    {c.ev_note && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {c.ev_note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900">
                        {fmt(c.price)}
                      </p>
                      <p className="text-xs text-slate-400">
                        Updated {fmtDate(c.updated_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditing(c)}
                      className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editing && (
        <EditModal
          coe={editing}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}
