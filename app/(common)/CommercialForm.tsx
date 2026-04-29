"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Truck, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DealerOption {
  id: number;
  slug: string;
  name: string;
}

// Supabase returns snake_case — all fields optional except id/name/brand/model/slug
interface ExistingEv {
  id: number;
  name: string;
  brand: string;
  model: string;
  slug: string;
  category?: string;
  year?: number | null;
  dealer_id?: number;
  dealer_slug?: string;
  price_min?: number;
  price_max?: number;
  range_km?: number;
  payload_kg?: number | null;
  charging_time_fast?: string;
  charging_time_slow?: string;
  image_url?: string;
  description?: string;
  highlights?: string;
  status?: string;
}

type Props =
  | {
      role: "admin";
      dealers: DealerOption[];
      dealerId?: never;
      dealerSlug?: never;
      existing?: ExistingEv;
      backHref: string;
    }
  | {
      role: "dealer";
      dealerId: number; // from session
      dealerSlug: string; // from session
      dealers?: never;
      existing?: ExistingEv;
      backHref: string;
    };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORIES = ["Van", "Truck", "Lorry", "Bus", "Pickup", "Other"];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseHighlights(raw?: string | null): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.join(", ") : "";
  } catch {
    return raw;
  }
}

function buildInitialForm(existing?: ExistingEv) {
  if (!existing) {
    return {
      name: "",
      brand: "",
      model: "",
      slug: "",
      category: "Van",
      year: "",
      priceMin: "",
      priceMax: "",
      rangeKm: "",
      payloadKg: "",
      chargingTimeFast: "",
      chargingTimeSlow: "",
      imageUrl: "",
      description: "",
      highlights: "",
      status: "active",
      // admin dealer picker — stores "id::slug" so we get both values
      dealerKey: "",
    };
  }

  return {
    name: existing.name ?? "",
    brand: existing.brand ?? "",
    model: existing.model ?? "",
    slug: existing.slug ?? "",
    category: existing.category ?? "Van",
    year: existing.year != null ? String(existing.year) : "",
    priceMin: existing.price_min != null ? String(existing.price_min) : "",
    priceMax: existing.price_max != null ? String(existing.price_max) : "",
    rangeKm: existing.range_km != null ? String(existing.range_km) : "",
    payloadKg: existing.payload_kg != null ? String(existing.payload_kg) : "",
    chargingTimeFast: existing.charging_time_fast ?? "",
    chargingTimeSlow: existing.charging_time_slow ?? "",
    imageUrl: existing.image_url ?? "",
    description: existing.description ?? "",
    highlights: parseHighlights(existing.highlights),
    status: existing.status ?? "active",
    // rebuild the "id::slug" key used by the admin picker
    dealerKey: existing.dealer_id
      ? `${existing.dealer_id}::${existing.dealer_slug ?? ""}`
      : "",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CommercialEvForm({
  role,
  dealers,
  dealerId,
  dealerSlug,
  existing,
  backHref,
}: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const isEdit = !!existing;
  const [form, setForm] = useState(() => buildInitialForm(existing));
  const [autoSlug, setAutoSlug] = useState(!existing);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const highlightsArr = form.highlights
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Admin: parse dealer_id + dealer_slug out of the combined key "id::slug"
    // Dealer: use values injected from session
    let resolvedDealerId: number;
    let resolvedDealerSlug: string;

    if (role === "admin") {
      const [idPart, ...slugParts] = form.dealerKey.split("::");
      resolvedDealerId = parseInt(idPart);
      resolvedDealerSlug = slugParts.join("::");
    } else {
      resolvedDealerId = dealerId;
      resolvedDealerSlug = dealerSlug;
    }

    const body = {
      name: form.name,
      brand: form.brand,
      model: form.model,
      slug: form.slug,
      category: form.category,
      year: form.year ? parseInt(form.year) : null,
      dealerId: resolvedDealerId,
      dealerSlug: resolvedDealerSlug,
      priceMin: parseInt(form.priceMin) || 0,
      priceMax: parseInt(form.priceMax) || 0,
      rangeKm: parseInt(form.rangeKm) || 0,
      payloadKg: form.payloadKg ? parseInt(form.payloadKg) : null,
      chargingTimeFast: form.chargingTimeFast,
      chargingTimeSlow: form.chargingTimeSlow,
      imageUrl: form.imageUrl,
      description: form.description,
      highlights: JSON.stringify(highlightsArr),
      status: form.status,
    };

    startTransition(async () => {
      const url = isEdit
        ? `/api/commercial-evs/${existing!.id}`
        : "/api/commercial-evs";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        toast({ title: err.error ?? "Failed", variant: "destructive" });
        return;
      }

      toast({
        title: isEdit ? "Commercial EV updated" : "Commercial EV created",
      });
      router.push(backHref);
      router.refresh();
    });
  }

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-emerald-600" />
            {isEdit ? "Edit commercial EV" : "Add commercial EV"}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isEdit
              ? "Update details for this listing"
              : "Create a new commercial EV listing"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Basic information ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Basic information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (autoSlug) set("slug", slugify(e.target.value));
                  }}
                  placeholder="e.g. BYD T3 Electric Van"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Brand <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={form.brand}
                  onChange={(e) => set("brand", e.target.value)}
                  placeholder="e.g. BYD"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Model <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={form.model}
                  onChange={(e) => set("model", e.target.value)}
                  placeholder="e.g. T3"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Slug <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={form.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    set("slug", e.target.value);
                  }}
                  placeholder="byd-t3-electric-van"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Input
                  type="number"
                  min="2000"
                  max="2030"
                  value={form.year}
                  onChange={(e) => set("year", e.target.value)}
                  placeholder="2024"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => set("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => set("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dealer picker — admin only */}
            {role === "admin" && dealers && (
              <div className="space-y-1.5">
                <Label>
                  Assign to dealer <span className="text-red-500">*</span>
                </Label>
                <Select
                  required
                  value={form.dealerKey || "__none__"}
                  onValueChange={(v) =>
                    set("dealerKey", v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dealer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      — Select a dealer —
                    </SelectItem>
                    {dealers.map((d) => (
                      // value encodes both id and slug so we can split them on submit
                      <SelectItem key={d.id} value={`${d.id}::${d.slug}`}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                  Required — every listing must belong to a dealer.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Specifications ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Price min (S$)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.priceMin}
                  onChange={(e) => set("priceMin", e.target.value)}
                  placeholder="80000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Price max (S$)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.priceMax}
                  onChange={(e) => set("priceMax", e.target.value)}
                  placeholder="120000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Range (km)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.rangeKm}
                  onChange={(e) => set("rangeKm", e.target.value)}
                  placeholder="200"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payload capacity (kg)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.payloadKg}
                  onChange={(e) => set("payloadKg", e.target.value)}
                  placeholder="800"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fast charging time</Label>
                <Input
                  value={form.chargingTimeFast}
                  onChange={(e) => set("chargingTimeFast", e.target.value)}
                  placeholder="e.g. 1.5 hrs (DC 80 kW)"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slow charging time</Label>
                <Input
                  value={form.chargingTimeSlow}
                  onChange={(e) => set("chargingTimeSlow", e.target.value)}
                  placeholder="e.g. 8 hrs (AC 7.4 kW)"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Content ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <Input
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Overview of this commercial EV..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Highlights</Label>
              <Input
                value={form.highlights}
                onChange={(e) => set("highlights", e.target.value)}
                placeholder="e.g. Low running cost, Zero emissions, LTA-approved"
              />
              <p className="text-xs text-slate-400">
                Separate each highlight with a comma.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(backHref)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? (
              "Saving…"
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />{" "}
                {isEdit ? "Save changes" : "Create listing"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
