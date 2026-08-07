"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Plug,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Constants ────────────────────────────────────────────────────────────────

const AREAS = [
  "CBD / Marina Bay",
  "Orchard",
  "Central",
  "North",
  "North-East",
  "East",
  "West",
  "South",
];
const NETWORKS = [
  "Shell Recharge",
  "SP Mobility",
  "Tesla Supercharger",
  "ChargePoint",
  "BlueSG",
  "Greenlots",
  "Charge+",
  "Other",
];
const CONNECTOR_OPTIONS = [
  "CCS2",
  "CHAdeMO",
  "Type 2 AC",
  "Tesla (CCS adapter)",
  "Tesla Proprietary",
  "GB/T DC",
  "GB/T AC",
];
const NETWORK_COLORS: Record<string, string> = {
  "Shell Recharge": "bg-orange-100 text-orange-700",
  "SP Mobility": "bg-blue-100 text-blue-700",
  "Tesla Supercharger": "bg-red-100 text-red-700",
  ChargePoint: "bg-emerald-100 text-emerald-700",
  BlueSG: "bg-indigo-100 text-indigo-700",
  Greenlots: "bg-lime-100 text-lime-700",
  "Charge+": "bg-purple-100 text-purple-700",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Station {
  id: number;
  name: string;
  network: string;
  lat: number;
  lng: number;
  address: string;
  area: string;
  connectors: number;
  connectorTypes: string; // JSON string of string[]
  power: string;
  pricing: string;
  hours: string;
}

interface StationForm {
  name: string;
  network: string;
  lat: string;
  lng: string;
  address: string;
  area: string;
  connectors: string;
  connectorTypes: string[];
  power: string;
  pricing: string;
  hours: string;
}

const EMPTY: StationForm = {
  name: "",
  network: "SP Mobility",
  lat: "",
  lng: "",
  address: "",
  area: "Central",
  connectors: "4",
  connectorTypes: ["CCS2", "Type 2 AC"],
  power: "",
  pricing: "",
  hours: "24 hours",
};

function toForm(s: Station): StationForm {
  return {
    name: s.name,
    network: s.network,
    lat: String(s.lat),
    lng: String(s.lng),
    address: s.address,
    area: s.area,
    connectors: String(s.connectors),
    connectorTypes: JSON.parse(s.connectorTypes) as string[],
    power: s.power,
    pricing: s.pricing,
    hours: s.hours,
  };
}

// ─── Shared input style ───────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400";

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

// ─── Station Modal ────────────────────────────────────────────────────────────

function StationModal({
  station,
  networkOptions,
  onClose,
  onSaved,
}: {
  station: Station | null;
  networkOptions: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = station !== null;
  const [form, setForm] = useState<StationForm>(
    station ? toForm(station) : EMPTY,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof StationForm>(k: K, v: StationForm[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function toggleConnector(c: string) {
    setForm((prev) => ({
      ...prev,
      connectorTypes: prev.connectorTypes.includes(c)
        ? prev.connectorTypes.filter((x) => x !== c)
        : [...prev.connectorTypes, c],
    }));
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
    if (!form.lat || isNaN(parseFloat(form.lat))) {
      setError("Valid latitude is required");
      return;
    }
    if (!form.lng || isNaN(parseFloat(form.lng))) {
      setError("Valid longitude is required");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        connectors: parseInt(form.connectors) || 1,
        connectorTypes: JSON.stringify(form.connectorTypes),
      };

      const url = isEdit
        ? `/api/charging-stations/${station!.id}`
        : "/api/charging-stations";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
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
            {isEdit ? "Edit Station" : "Add Charging Station"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 px-6 py-5 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Station Name *">
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Shell Recharge – Orchard"
              />
            </Field>
            <Field label="Network">
              <input
                className={inputCls}
                list="network-options"
                value={form.network}
                onChange={(e) => set("network", e.target.value)}
                placeholder="Select or type a network"
              />
              <datalist id="network-options">
                {(networkOptions.length ? networkOptions : NETWORKS).map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </Field>
          </div>

          <Field label="Address *">
            <input
              className={inputCls}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Full Singapore address"
            />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Area">
              <select
                className={inputCls}
                value={form.area}
                onChange={(e) => set("area", e.target.value)}
              >
                {AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field label="Latitude *">
              <input
                className={inputCls}
                type="number"
                step="0.0001"
                value={form.lat}
                onChange={(e) => set("lat", e.target.value)}
                placeholder="e.g. 1.3040"
              />
            </Field>
            <Field label="Longitude *">
              <input
                className={inputCls}
                type="number"
                step="0.0001"
                value={form.lng}
                onChange={(e) => set("lng", e.target.value)}
                placeholder="e.g. 103.8318"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Number of Connectors">
              <input
                className={inputCls}
                type="number"
                min="1"
                value={form.connectors}
                onChange={(e) => set("connectors", e.target.value)}
              />
            </Field>
            <Field label="Power Output">
              <input
                className={inputCls}
                value={form.power}
                onChange={(e) => set("power", e.target.value)}
                placeholder="e.g. Up to 50kW DC"
              />
            </Field>
          </div>

          <Field label="Connector Types">
            <div className="flex flex-wrap gap-2 mt-1">
              {CONNECTOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleConnector(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.connectorTypes.includes(c)
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Pricing">
              <input
                className={inputCls}
                value={form.pricing}
                onChange={(e) => set("pricing", e.target.value)}
                placeholder="e.g. $0.55/kWh"
              />
            </Field>
            <Field label="Operating Hours">
              <input
                className={inputCls}
                value={form.hours}
                onChange={(e) => set("hours", e.target.value)}
                placeholder="e.g. 24 hours"
              />
            </Field>
          </div>

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
            onClick={handleSubmit}
            disabled={saving}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? "Save Changes" : "Add Station"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChargingAdminClient({
  initialPage,
  initialSearch = "",
  initialNetwork = "All",
  initialArea = "All",
}: {
  initialPage: number;
  initialSearch?: string;
  initialNetwork?: string;
  initialArea?: string;
}) {
  const router = useRouter();
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [networkFilter, setNetworkFilter] = useState(initialNetwork);
  const [areaFilter, setAreaFilter] = useState(initialArea);
  const [networkOptions, setNetworkOptions] = useState<string[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Station | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(20); // items per page
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const PAGE_GROUP_SIZE = 6;
  const isFirstRender = useRef(true);

  // ── Distinct networks (loaded once, drives the Network dropdown) ─────────────

  useEffect(() => {
    fetch("/api/charging-stations/networks")
      .then((r) => r.json())
      .then((d) => setNetworkOptions(Array.isArray(d.networks) ? d.networks : []))
      .catch(() => setNetworkOptions([]));
  }, []);

  // ── Debounce the search box ──────────────────────────────────────────────────

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // ── Fetch (server-side search + filters) ─────────────────────────────────────

  const fetchStations = useCallback(
    async (pageNum: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: String(limit),
        });
        if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
        if (networkFilter !== "All") params.set("network", networkFilter);
        if (areaFilter !== "All") params.set("area", areaFilter);

        const res = await fetch(`/api/charging-stations?${params.toString()}`);
        const result = await res.json();

        if (result.error && !result.data) {
          setError(result.error);
          setStations([]);
          setTotal(0);
          setTotalPages(0);
        } else if (Array.isArray(result)) {
          // Fallback for old API format
          setStations(result);
          setTotal(result.length);
          setTotalPages(1);
        } else {
          // Paginated format
          setStations(result.data || []);
          setTotal(result.total || 0);
          setTotalPages(result.totalPages || 0);
          setError(result.error || null);
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch stations");
        setStations([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    },
    [limit, debouncedSearch, networkFilter, areaFilter],
  );

  // Reset to page 1 whenever a filter/search changes (but not on first mount,
  // so a deep-linked ?page=N is respected).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
  }, [debouncedSearch, networkFilter, areaFilter]);

  // Fetch on page or filter change
  useEffect(() => {
    fetchStations(page);
  }, [page, fetchStations]);

  // Keep the URL in sync so filters/search survive refresh & are shareable
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (networkFilter !== "All") params.set("network", networkFilter);
    if (areaFilter !== "All") params.set("area", areaFilter);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [page, debouncedSearch, networkFilter, areaFilter, router]);

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id: number) {
    setDeleting(true);
    try {
      await fetch(`/api/charging-stations/${id}`, { method: "DELETE" });
      setConfirmDelete(null);
      if (page === 1) {
        await fetchStations(1);
      } else {
        setPage(1);
      }
    } finally {
      setDeleting(false);
    }
  }
  function getPageGroup(current: number, total: number) {
    const groupIndex = Math.floor((current - 1) / PAGE_GROUP_SIZE);

    const start = groupIndex * PAGE_GROUP_SIZE + 1;
    const end = Math.min(start + PAGE_GROUP_SIZE - 1, total);

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return { pages, start, end };
  }
  const { pages } = getPageGroup(page, totalPages);
  const goToPage = (p: number) => {
    setPage(p);
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const networks = ["All", ...networkOptions];
  const areaOptions = ["All", ...AREAS];
  const hasFilters =
    debouncedSearch.trim() !== "" ||
    networkFilter !== "All" ||
    areaFilter !== "All";

  const clearFilters = () => {
    setSearch("");
    setNetworkFilter("All");
    setAreaFilter("All");
  };

  // Connectors shown on the current page (full-set total isn't returned).
  const pageConnectors = stations.reduce((sum, s) => sum + s.connectors, 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Charging Map</h1>
          <p className="text-slate-500 text-sm mt-1">
            {total} {hasFilters ? "matching" : "total"} stations ·{" "}
            {stations.length} showing · {pageConnectors} connectors on page
            {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-4 w-4" /> Add Station
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-56">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, address or area…"
            className="w-full pl-4 pr-9 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-100 text-slate-400"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={networkFilter}
          onChange={(e) => setNetworkFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 min-w-44"
        >
          {networks.map((n) => (
            <option key={n} value={n}>
              {n === "All" ? "All networks" : n}
            </option>
          ))}
        </select>

        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 min-w-40"
        >
          {areaOptions.map((a) => (
            <option key={a} value={a}>
              {a === "All" ? "All areas" : a}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm font-medium text-slate-600 rounded-xl border border-slate-200 bg-white hover:border-slate-300 flex items-center gap-1.5"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-6">
          <p className="font-medium">Failed to load stations</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      ) : stations.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Zap className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No stations found</p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {stations.map((s) => {
            const types = JSON.parse(s.connectorTypes) as string[];
            const netColor =
              NETWORK_COLORS[s.network] || "bg-slate-100 text-slate-600";
            return (
              <Card
                key={s.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-slate-900 text-sm">
                          {s.name}
                        </h3>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${netColor}`}
                        >
                          {s.network}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {s.area}
                        </span>
                        <span className="flex items-center gap-1">
                          <Plug className="h-3 w-3" />
                          {s.connectors} connectors
                        </span>
                        {s.power && <span>{s.power}</span>}
                        {s.pricing && (
                          <span className="font-medium text-emerald-600">
                            {s.pricing}
                          </span>
                        )}
                        <span>{s.hours}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {s.address}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {types.map((t) => (
                          <span
                            key={t}
                            className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-500 hover:text-slate-800"
                        onClick={() => {
                          setEditing(s);
                          setModal(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setConfirmDelete(s)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {/* Pagination */}
      <div className="flex justify-center mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2">
          {/* Previous */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(Math.max(1, page - 1))}
            disabled={page === 1 || isLoading}
          >
            ← Previous
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pages.map((p: any) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`h-8 w-8 rounded-lg text-xs font-medium ${
                  page === p
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Next */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || isLoading}
          >
            Next →
          </Button>
        </div>
      </div>
      {/* Add / Edit Modal */}
      {modal && (
        <StationModal
          station={editing}
          networkOptions={networkOptions}
          onClose={() => {
            setModal(false);
            setEditing(null);
          }}
          onSaved={() => {
            setPage(1);
            fetchStations(1);
          }}
        />
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Delete Station?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Remove <strong>{confirmDelete.name}</strong> from the charging
              map? This cannot be undone.
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
