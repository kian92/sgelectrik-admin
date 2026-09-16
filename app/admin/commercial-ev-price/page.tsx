"use client";

import * as React from "react";
import { Trash2, Plus, Save, Loader2, Pencil, X, Check } from "lucide-react";

interface Brand {
  id: string;
  name: string;
}

interface ApiRow {
  id: string;
  model: string;
  price_from: number;
  updated_at: string;
  brand: Brand | Brand[] | null;
}

interface DraftRow {
  id: string;
  brandId: string;
  model: string;
  price_from: number;
  updated_at: string;
  isNew?: boolean;
  isDirty?: boolean;
}

function normalizeRow(row: ApiRow): DraftRow {
  const brand = Array.isArray(row.brand) ? row.brand[0] : row.brand;
  return {
    id: row.id,
    brandId: brand?.id ?? "",
    model: row.model,
    price_from: row.price_from,
    updated_at: row.updated_at,
  };
}

export default function AdminCommercialEvPricesPage() {
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [rows, setRows] = React.useState<DraftRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // --- Brand management state ---
  const [newBrandName, setNewBrandName] = React.useState("");
  const [addingBrand, setAddingBrand] = React.useState(false);
  const [editingBrandId, setEditingBrandId] = React.useState<string | null>(
    null,
  );
  const [editingBrandName, setEditingBrandName] = React.useState("");
  const [brandBusyId, setBrandBusyId] = React.useState<string | null>(null);

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [brandsRes, rowsRes] = await Promise.all([
        fetch("/api/admin/commercial-ev-brands"),
        fetch("/api/admin/commercial-ev-prices"),
      ]);
      if (!brandsRes.ok) throw new Error("Failed to load brands.");
      if (!rowsRes.ok) throw new Error("Failed to load models.");

      const brandsBody = await brandsRes.json();
      const rowsBody = await rowsRes.json();

      setBrands(brandsBody.brands ?? []);
      setRows((rowsBody.rows ?? []).map(normalizeRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const brandName = React.useCallback(
    (id: string) => brands.find((b) => b.id === id)?.name ?? "",
    [brands],
  );

  // --- Brand actions ---

  async function addBrand(e: React.FormEvent) {
    e.preventDefault();
    const name = newBrandName.trim();
    if (!name) return;

    setAddingBrand(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/commercial-ev-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to add brand.");
      setBrands((prev) =>
        [...prev, body.brand].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setNewBrandName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAddingBrand(false);
    }
  }

  function startEditBrand(brand: Brand) {
    setEditingBrandId(brand.id);
    setEditingBrandName(brand.name);
  }

  async function saveBrandName(id: string) {
    const name = editingBrandName.trim();
    if (!name) return;

    setBrandBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/commercial-ev-brands/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to rename brand.");
      setBrands((prev) =>
        prev
          .map((b) => (b.id === id ? body.brand : b))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingBrandId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBrandBusyId(null);
    }
  }

  async function deleteBrand(brand: Brand) {
    if (!confirm(`Delete brand "${brand.name}"?`)) return;

    setBrandBusyId(brand.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/commercial-ev-brands/${brand.id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to delete brand.");
      setBrands((prev) => prev.filter((b) => b.id !== brand.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBrandBusyId(null);
    }
  }

  // --- Model row actions ---

  function updateLocalField(
    id: string,
    field: "brandId" | "model" | "price_from",
    value: string,
  ) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: field === "price_from" ? Number(value) || 0 : value,
              isDirty: true,
            }
          : row,
      ),
    );
  }

  function addBlankRow() {
    if (brands.length === 0) {
      setError("Add a brand first, then you can add models under it.");
      return;
    }
    const tempId = `new-${crypto.randomUUID()}`;
    setRows((prev) => [
      {
        id: tempId,
        brandId: "",
        model: "",
        price_from: 0,
        updated_at: new Date().toISOString(),
        isNew: true,
        isDirty: true,
      },
      ...prev,
    ]);
  }

  async function saveRow(row: DraftRow) {
    if (!row.brandId) {
      setError("Pick a brand for this model.");
      return;
    }
    if (!row.model.trim()) {
      setError("Model name can't be empty.");
      return;
    }

    setSavingId(row.id);
    setError(null);

    try {
      if (row.isNew) {
        const res = await fetch("/api/admin/commercial-ev-prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandId: row.brandId,
            model: row.model,
            priceFrom: row.price_from,
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Save failed.");
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? normalizeRow(body.row) : r)),
        );
      } else {
        const res = await fetch(`/api/admin/commercial-ev-prices/${row.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandId: row.brandId,
            model: row.model,
            priceFrom: row.price_from,
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Save failed.");
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? normalizeRow(body.row) : r)),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRow(row: DraftRow) {
    if (row.isNew) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      return;
    }
    if (!confirm(`Delete ${brandName(row.brandId)} ${row.model}?`)) return;

    setSavingId(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/commercial-ev-prices/${row.id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Delete failed.");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="border-b border-border/60 bg-muted/20">
        <div className="container mx-auto max-w-screen-xl px-4 md:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Commercial EV Price List
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage commercial brands and models. Prices are stored before COE;
              the public page adds the latest Category C premium.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-screen-xl px-4 md:px-8 py-8 space-y-8">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* --- Brands --- */}
        <section className="rounded-2xl border border-border/60 p-5">
          <h2 className="text-base font-bold text-foreground mb-3">Brands</h2>

          <form onSubmit={addBrand} className="flex items-center gap-2 mb-4">
            <input
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="New brand name (e.g. Foton)"
              className="h-9 px-3 rounded-lg border border-border/60 bg-background text-sm w-64"
            />
            <button
              type="submit"
              disabled={addingBrand || !newBrandName.trim()}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {addingBrand ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add brand
            </button>
          </form>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading brands...</p>
          ) : brands.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No brands yet - add one above before creating models.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full border border-border/60 bg-muted/20 text-sm"
                >
                  {editingBrandId === brand.id ? (
                    <>
                      <input
                        autoFocus
                        value={editingBrandName}
                        onChange={(e) => setEditingBrandName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveBrandName(brand.id);
                          if (e.key === "Escape") setEditingBrandId(null);
                        }}
                        className="h-6 px-1.5 rounded border border-border/60 text-sm w-32"
                      />
                      <button
                        onClick={() => saveBrandName(brand.id)}
                        disabled={brandBusyId === brand.id}
                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted"
                        title="Save"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingBrandId(null)}
                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted"
                        title="Cancel"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">
                        {brand.name}
                      </span>
                      <button
                        onClick={() => startEditBrand(brand)}
                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
                        title="Rename"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteBrand(brand)}
                        disabled={brandBusyId === brand.id}
                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-red-50 text-red-600"
                        title="Delete"
                      >
                        {brandBusyId === brand.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* --- Models --- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-foreground">Models</h2>
            <button
              onClick={addBlankRow}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add model
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading models...</p>
          ) : (
            <div className="rounded-2xl border border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-left">
                      <th className="px-4 py-3 font-semibold text-foreground w-56">
                        Brand
                      </th>
                      <th className="px-4 py-3 font-semibold text-foreground">
                        Model
                      </th>
                      <th className="px-4 py-3 font-semibold text-foreground text-right w-52">
                        Price From before COE (S$)
                      </th>
                      <th className="px-4 py-3 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-t border-border/40">
                        <td className="px-4 py-2">
                          <select
                            value={row.brandId}
                            onChange={(e) =>
                              updateLocalField(
                                row.id,
                                "brandId",
                                e.target.value,
                              )
                            }
                            className="w-full h-9 px-2 rounded-md border border-border/60 bg-background"
                          >
                            <option value="" disabled>
                              Select brand
                            </option>
                            {brands.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            value={row.model}
                            onChange={(e) =>
                              updateLocalField(row.id, "model", e.target.value)
                            }
                            className="w-full h-9 px-2 rounded-md border border-border/60 bg-background"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={0}
                            value={row.price_from}
                            onChange={(e) =>
                              updateLocalField(
                                row.id,
                                "price_from",
                                e.target.value,
                              )
                            }
                            className="w-full h-9 px-2 rounded-md border border-border/60 bg-background text-right"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => saveRow(row)}
                              disabled={savingId === row.id || !row.isDirty}
                              title="Save"
                              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-30"
                            >
                              {savingId === row.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => deleteRow(row)}
                              disabled={savingId === row.id}
                              title="Delete"
                              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-red-50 text-red-600 disabled:opacity-30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No models yet. Click &ldquo;Add model&rdquo; to create
                          one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
