"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, X, Save, Loader2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export interface CoeHistoryRow {
  id: number;
  exercise_date: string;
  exercise_label: string;
  cat_a: number;
  cat_b: number;
  cat_c: number;
  cat_d: number;
  cat_e: number;
  created_at: string;
}

interface RowForm {
  exercise_date: string;
  exercise_label: string;
  cat_a: string;
  cat_b: string;
  cat_c: string;
  cat_d: string;
  cat_e: string;
}

const EMPTY_FORM: RowForm = {
  exercise_date: "",
  exercise_label: "",
  cat_a: "",
  cat_b: "",
  cat_c: "",
  cat_d: "",
  cat_e: "",
};

const inputCls =
  "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400";

const fmt = (p: number) => "$" + p.toLocaleString("en-SG");
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function toForm(row: CoeHistoryRow): RowForm {
  return {
    exercise_date: row.exercise_date,
    exercise_label: row.exercise_label,
    cat_a: String(row.cat_a),
    cat_b: String(row.cat_b),
    cat_c: String(row.cat_c),
    cat_d: String(row.cat_d),
    cat_e: String(row.cat_e),
  };
}

function toPayload(f: RowForm) {
  return {
    exercise_date: f.exercise_date,
    exercise_label: f.exercise_label.trim(),
    cat_a: parseInt(f.cat_a) || 0,
    cat_b: parseInt(f.cat_b) || 0,
    cat_c: parseInt(f.cat_c) || 0,
    cat_d: parseInt(f.cat_d) || 0,
    cat_e: parseInt(f.cat_e) || 0,
  };
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ExerciseModal({
  row,
  onClose,
  onSaved,
}: {
  row: CoeHistoryRow | null;
  onClose: () => void;
  onSaved: (updated: CoeHistoryRow) => void;
}) {
  const isEdit = row !== null;
  const [form, setForm] = useState<RowForm>(row ? toForm(row) : EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field: keyof RowForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.exercise_date || !form.exercise_label.trim()) {
      setError("Date and label are required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const url = isEdit ? `/api/coe-history/${row!.id}` : "/api/coe-history";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved: CoeHistoryRow = await res.json();
      onSaved(saved);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit Exercise" : "Add Bidding Exercise"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Exercise Date *</label>
              <input
                type="date"
                className={inputCls}
                value={form.exercise_date}
                onChange={(e) => set("exercise_date", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Label *</label>
              <input
                className={inputCls}
                value={form.exercise_label}
                onChange={(e) => set("exercise_label", e.target.value)}
                placeholder="e.g. Jun 2026 (1st)"
              />
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">COE Prices (S$)</p>
          <div className="grid grid-cols-5 gap-3">
            {(["cat_a", "cat_b", "cat_c", "cat_d", "cat_e"] as const).map((cat) => (
              <div key={cat}>
                <label className="block text-xs font-medium text-slate-600 mb-1 text-center">
                  Cat {cat.slice(-1).toUpperCase()}
                </label>
                <input
                  type="number"
                  className={inputCls + " text-center font-mono"}
                  value={form[cat]}
                  onChange={(e) => set(cat, e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? "Save Changes" : "Add Exercise"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SortKey = "exercise_date" | "cat_a" | "cat_b" | "cat_c" | "cat_d" | "cat_e";
type SortDir = "asc" | "desc";

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />;
  return sortDir === "asc"
    ? <ChevronUp className="h-3.5 w-3.5 text-slate-700" />
    : <ChevronDown className="h-3.5 w-3.5 text-slate-700" />;
}

export default function CoeHistoryClient({
  initialRows,
}: {
  initialRows: CoeHistoryRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<CoeHistoryRow[]>(initialRows);
  const [sortKey, setSortKey] = useState<SortKey>("exercise_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<CoeHistoryRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CoeHistoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = sortKey === "exercise_date" ? a[sortKey] : a[sortKey];
      const bv = sortKey === "exercise_date" ? b[sortKey] : b[sortKey];
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortKey, sortDir]);

  function openAdd() {
    setEditing(null);
    setModal("add");
  }
  function openEdit(row: CoeHistoryRow) {
    setEditing(row);
    setModal("edit");
  }
  function closeModal() {
    setModal(null);
    setEditing(null);
  }

  function handleSaved(saved: CoeHistoryRow) {
    setRows((prev) => {
      const exists = prev.find((r) => r.id === saved.id);
      if (exists) return prev.map((r) => (r.id === saved.id ? saved : r));
      return [saved, ...prev];
    });
    router.refresh();
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    try {
      await fetch(`/api/coe-history/${id}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.id !== id));
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">COE History</h1>
          <p className="text-slate-500 text-sm mt-1">
            All past bidding exercise results — {rows.length} exercises recorded
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-4 w-4" /> Add Exercise
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Exercise</th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => toggleSort("exercise_date")}
                  className="flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
                >
                  Date <SortIcon col="exercise_date" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </th>
              {(["cat_a", "cat_b", "cat_c", "cat_d", "cat_e"] as SortKey[]).map((cat) => (
                <th key={cat} className="text-right px-4 py-3">
                  <button
                    onClick={() => toggleSort(cat)}
                    className="flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900 ml-auto"
                  >
                    Cat {cat.slice(-1).toUpperCase()} <SortIcon col={cat} sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{row.exercise_label}</td>
                <td className="px-4 py-3 text-slate-500">{fmtDate(row.exercise_date)}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-700">{fmt(row.cat_a)}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-700">{fmt(row.cat_b)}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-700">{fmt(row.cat_c)}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-700">{fmt(row.cat_d)}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-700">{fmt(row.cat_e)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-500 hover:text-slate-800 gap-1 h-7 px-2"
                      onClick={() => openEdit(row)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 px-2"
                      onClick={() => setConfirmDelete(row)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="font-medium">No exercises recorded yet</p>
            <p className="text-sm mt-1">Click &quot;Add Exercise&quot; to add the first one</p>
          </div>
        )}
      </div>

      {(modal === "add" || modal === "edit") && (
        <ExerciseModal
          row={modal === "edit" ? editing : null}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Exercise?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete <strong>{confirmDelete.exercise_label}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={() => handleDelete(confirmDelete.id)}
                className="gap-2"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
