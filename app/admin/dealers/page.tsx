"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  Save,
  Loader2,
} from "lucide-react";

const AREA_OPTIONS = ["Central", "North", "South", "East", "West"];

interface DealerDB {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  brands: string[];
  car_ids: string[];
  area: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  hours: string;
  established: number | null;
  showrooms: number;
  description: string;
  highlights: string[];
  certifications: string[];
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface DealerForm {
  slug: string;
  name: string;
  short_name: string;
  brands: string;
  area: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  hours: string;
  established: string;
  showrooms: string;
  description: string;
  highlights: string;
  certifications: string;
  status: "active" | "inactive";
}

const EMPTY_FORM: DealerForm = {
  slug: "",
  name: "",
  short_name: "",
  brands: "",
  area: "Central",
  address: "",
  phone: "",
  email: "",
  website: "",
  hours: "",
  established: "",
  showrooms: "1",
  description: "",
  highlights: "",
  certifications: "",
  status: "active",
};

function toForm(d: DealerDB): DealerForm {
  return {
    slug: d.slug,
    name: d.name,
    short_name: d.short_name,
    brands: d.brands.join(", "),
    area: d.area,
    address: d.address,
    phone: d.phone,
    email: d.email,
    website: d.website,
    hours: d.hours,
    established: d.established ? String(d.established) : "",
    showrooms: String(d.showrooms),
    description: d.description,
    highlights: d.highlights.join("\n"),
    certifications: d.certifications.join(", "),
    status: d.status,
  };
}

function toPayload(f: DealerForm) {
  return {
    slug: f.slug.trim().toLowerCase().replace(/\s+/g, "-"),
    name: f.name.trim(),
    short_name: f.short_name.trim() || f.name.trim(),
    brands: f.brands
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    car_ids: [],
    area: f.area,
    address: f.address.trim(),
    phone: f.phone.trim(),
    email: f.email.trim(),
    website: f.website.trim(),
    hours: f.hours.trim(),
    established: f.established ? parseInt(f.established) : null,
    showrooms: parseInt(f.showrooms) || 1,
    description: f.description.trim(),
    highlights: f.highlights
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    certifications: f.certifications
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    status: f.status,
  };
}

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

const inputCls =
  "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400";

// ─── Modal ────────────────────────────────────────────────────────────────────

function DealerModal({
  dealer,
  onClose,
  onSaved,
}: {
  dealer: DealerDB | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = dealer !== null;
  const [form, setForm] = useState<DealerForm>(
    dealer ? toForm(dealer) : EMPTY_FORM,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set(field: keyof DealerForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!form.address.trim()) {
      setError("Address is required");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }
    if (!form.slug.trim() && !isEdit) {
      setError("Slug is required");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const url = isEdit ? `/api/dealers/${dealer!.id}` : "/api/dealers";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit Dealer" : "Add Dealer"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 px-6 py-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Dealer Name *">
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!isEdit)
                    set(
                      "slug",
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, ""),
                    );
                }}
                placeholder="e.g. Tesla Singapore"
              />
            </Field>
            <Field label="Short Name">
              <input
                className={inputCls}
                value={form.short_name}
                onChange={(e) => set("short_name", e.target.value)}
                placeholder="e.g. Tesla"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="URL Slug *">
              <input
                className={inputCls}
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="e.g. tesla-singapore"
              />
            </Field>
            <Field label="Area">
              <select
                className={inputCls}
                value={form.area}
                onChange={(e) => set("area", e.target.value)}
              >
                {AREA_OPTIONS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Brands (comma separated)">
            <input
              className={inputCls}
              value={form.brands}
              onChange={(e) => set("brands", e.target.value)}
              placeholder="e.g. Tesla, BYD"
            />
          </Field>

          <Field label="Address *">
            <input
              className={inputCls}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="e.g. 1 Toa Payoh Industrial Park"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <input
                className={inputCls}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+65 6xxx xxxx"
              />
            </Field>
            <Field label="Email *">
              <input
                className={inputCls}
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="contact@dealer.com"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Website">
              <input
                className={inputCls}
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Opening Hours">
              <input
                className={inputCls}
                value={form.hours}
                onChange={(e) => set("hours", e.target.value)}
                placeholder="Mon–Sat 9am–7pm"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Est. Year">
              <input
                className={inputCls}
                type="number"
                value={form.established}
                onChange={(e) => set("established", e.target.value)}
                placeholder="e.g. 1990"
              />
            </Field>
            <Field label="Showrooms">
              <input
                className={inputCls}
                type="number"
                min="1"
                value={form.showrooms}
                onChange={(e) => set("showrooms", e.target.value)}
              />
            </Field>
            <Field label="Status">
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) =>
                  set("status", e.target.value as "active" | "inactive")
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>

          <Field label="Description">
            <textarea
              className={inputCls}
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description of this dealer..."
            />
          </Field>

          <Field label="Highlights (one per line)">
            <textarea
              className={inputCls}
              rows={3}
              value={form.highlights}
              onChange={(e) => set("highlights", e.target.value)}
              placeholder={"Authorised BYD dealer\n125+ years of heritage"}
            />
          </Field>

          <Field label="Certifications (comma separated)">
            <input
              className={inputCls}
              value={form.certifications}
              onChange={(e) => set("certifications", e.target.value)}
              placeholder="ISO 9001, BYD Certified"
            />
          </Field>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? "Save Changes" : "Add Dealer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDealers() {
  const [dealers, setDealers] = useState<DealerDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<DealerDB | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DealerDB | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dealers");
      const data = await res.json();
      setDealers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: number) {
    setDeleting(true);
    try {
      await fetch(`/api/dealers/${id}`, { method: "DELETE" });
      setConfirmDelete(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  const filtered = dealers.filter((d) => {
    const matchArea = areaFilter === "All" || d.area === areaFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.brands.some((b) => b.toLowerCase().includes(q));
    return matchArea && matchSearch;
  });

  function openAdd() {
    setEditing(null);
    setModal("add");
  }
  function openEdit(d: DealerDB) {
    setEditing(d);
    setModal("edit");
  }
  function closeModal() {
    setModal(null);
    setEditing(null);
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dealers</h1>
          <p className="text-slate-500 text-sm mt-1">
            {dealers.length} registered dealers
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-4 w-4" /> Add Dealer
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or brand…"
          className="px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 flex-1 min-w-48"
        />
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...AREA_OPTIONS].map((f) => (
            <button
              key={f}
              onClick={() => setAreaFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                areaFilter === f
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No dealers found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((dealer) => (
            <Card
              key={dealer.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-900">
                        {dealer.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                          dealer.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {dealer.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {dealer.brands.map((b) => (
                        <span
                          key={b}
                          className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {dealer.area} · {dealer.showrooms} showroom
                        {dealer.showrooms > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {dealer.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {dealer.phone}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/dealers/${dealer.slug}`} target="_blank">
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" /> View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-500 hover:text-slate-800 gap-1"
                      onClick={() => openEdit(dealer)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setConfirmDelete(dealer)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                  <div>
                    <p className="text-slate-400 mb-0.5">Est.</p>
                    <p className="font-medium">{dealer.established ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 mb-0.5">Hours</p>
                    <p className="font-medium">
                      {dealer.hours?.split(",")[0] || "—"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-slate-400 mb-0.5">Address</p>
                    <p className="font-medium">{dealer.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {(modal === "add" || modal === "edit") && (
        <DealerModal
          dealer={modal === "edit" ? editing : null}
          onClose={closeModal}
          onSaved={load}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Delete Dealer?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete{" "}
              <strong>{confirmDelete.name}</strong>? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
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
