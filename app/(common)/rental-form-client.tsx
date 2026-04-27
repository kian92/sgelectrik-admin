"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { ArrowLeft, Car, CheckCircle2, Plus, Trash2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DealerOption {
  id: number;
  slug: string;
  name: string;
  short_name: string | null;
}

interface FleetItem {
  id?: number; // present when editing existing fleet rows
  model: string;
  imageId: string;
  priceFrom: string;
  pricePeriod: string;
  rangeKm: string;
  seats: string;
  accel: string;
  chargeTime: string;
  bodyType: string;
}

interface FormState {
  name: string;
  slug: string;
  type: string;
  tagline: string;
  description: string;
  area: string;
  priceFrom: string;
  pricePeriod: string;
  featuresText: string;
  website: string;
  phone: string;
  rating: string;
  reviewCount: string;
  minTerm: string;
  depositRequired: string;
  includesInsurance: boolean;
  includesMaintenance: boolean;
  requiresLicenseYears: string;
  dealerIdAdmin: string; // dealer id (number as string) for admin assign
  fleet: FleetItem[];
}

interface Props {
  editingId: number | null;
  initialData: any | null; // raw Supabase row with rental_company_fleet[]
  dealers: DealerOption[];
  isAdmin: boolean;
  backHref: string;
  fixedDealerId?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_FLEET: FleetItem = {
  model: "",
  imageId: "",
  priceFrom: "",
  pricePeriod: "/day",
  rangeKm: "0",
  seats: "5",
  accel: "",
  chargeTime: "",
  bodyType: "",
};

const EMPTY: FormState = {
  name: "",
  slug: "",
  type: "Short-term Rental",
  tagline: "",
  description: "",
  area: "",
  priceFrom: "",
  pricePeriod: "/day",
  featuresText: "",
  website: "",
  phone: "",
  rating: "0.0",
  reviewCount: "0",
  minTerm: "",
  depositRequired: "",
  includesInsurance: false,
  includesMaintenance: false,
  requiresLicenseYears: "2",
  dealerIdAdmin: "",
  fleet: [],
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseFeatures(raw: string): string {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.join("\n") : "";
  } catch {
    return "";
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RentalFormClient({
  editingId,
  initialData,
  dealers,
  isAdmin,
  backHref,
  fixedDealerId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [autoSlug, setAutoSlug] = useState(!editingId);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setFleet = (i: number, k: keyof FleetItem, v: string) =>
    setForm((f) => ({
      ...f,
      fleet: f.fleet.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)),
    }));

  const addFleet = () =>
    setForm((f) => ({ ...f, fleet: [...f.fleet, { ...EMPTY_FLEET }] }));
  const removeFleet = (i: number) =>
    setForm((f) => ({ ...f, fleet: f.fleet.filter((_, idx) => idx !== i) }));

  // Populate form when editing
  useEffect(() => {
    if (!initialData) return;
    setForm({
      name: initialData.name ?? "",
      slug: initialData.slug ?? "",
      type: initialData.type ?? "Short-term Rental",
      tagline: initialData.tagline ?? "",
      description: initialData.description ?? "",
      area: initialData.area ?? "",
      priceFrom: initialData.price_from ?? "",
      pricePeriod: initialData.price_period ?? "/day",
      featuresText: parseFeatures(initialData.features ?? "[]"),
      website: initialData.website ?? "",
      phone: initialData.phone ?? "",
      rating: String(initialData.rating ?? "0.0"),
      reviewCount: String(initialData.review_count ?? 0),
      minTerm: initialData.min_term ?? "",
      depositRequired: initialData.deposit_required ?? "",
      includesInsurance: !!initialData.includes_insurance,
      includesMaintenance: !!initialData.includes_maintenance,
      requiresLicenseYears: String(initialData.requires_license_years ?? 2),
      dealerIdAdmin: String(initialData.dealer_id ?? ""),
      fleet: Array.isArray(initialData.rental_company_fleet)
        ? initialData.rental_company_fleet.map((f: any) => ({
            id: f.id,
            model: f.model ?? "",
            imageId: f.image_id ?? "",
            priceFrom: f.price_from ?? "",
            pricePeriod: f.price_period ?? "",
            rangeKm: String(f.range_km ?? 0),
            seats: String(f.seats ?? 5),
            accel: f.accel ?? "",
            chargeTime: f.charge_time ?? "",
            bodyType: f.body_type ?? "",
          }))
        : [],
    });
  }, [initialData]);

  // Auto-slug from name
  useEffect(() => {
    if (autoSlug && !editingId) set("slug", slugify(form.name));
  }, [form.name, autoSlug, editingId]);

  const isValid = form.name.trim().length > 0 && form.slug.trim().length > 0;

  function buildPayload() {
    const features = form.featuresText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      dealer_id: fixedDealerId
        ? fixedDealerId
        : form.dealerIdAdmin
          ? Number(form.dealerIdAdmin)
          : undefined,
      name: form.name.trim(),
      slug: form.slug.trim(),
      type: form.type,
      tagline: form.tagline,
      description: form.description,
      area: form.area,
      price_from: form.priceFrom,
      price_period: form.pricePeriod,
      features: JSON.stringify(features),
      website: form.website,
      phone: form.phone,
      rating: parseFloat(form.rating) || 0,
      review_count: parseInt(form.reviewCount) || 0,
      min_term: form.minTerm,
      deposit_required: form.depositRequired,
      includes_insurance: form.includesInsurance,
      includes_maintenance: form.includesMaintenance,
      requires_license_years: parseInt(form.requiresLicenseYears) || 2,
      fleet: form.fleet
        .filter((f) => f.model.trim().length > 0)
        .map((f) => ({
          ...(f.id ? { id: f.id } : {}),
          model: f.model.trim(),
          image_id: f.imageId || null,
          price_from: f.priceFrom,
          price_period: f.pricePeriod,
          range_km: parseInt(f.rangeKm) || 0,
          seats: parseInt(f.seats) || 5,
          accel: f.accel,
          charge_time: f.chargeTime,
          body_type: f.bodyType,
        })),
    };
  }

  async function handleSave() {
    if (!isValid) return;
    setError(null);

    startTransition(async () => {
      try {
        const url = editingId
          ? `/api/rental-companies/${editingId}`
          : "/api/rental-companies";
        const method = editingId ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload()),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to save");
        }

        router.push(backHref);
        router.refresh(); // revalidate server component data
      } catch (e: any) {
        setError(e.message ?? "Something went wrong");
      }
    });
  }

  const title = editingId ? "Edit Rental Company" : "Add Rental Company";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href={backHref}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-500 hover:text-slate-700 -ml-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Rentals
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Car className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isAdmin
                ? "Admin · manage any rental company"
                : "Manage your rental listing"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Basic information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label>Company name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Tribecar EV"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    set("slug", e.target.value);
                  }}
                  placeholder="tribecar-ev"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Car Sharing">Car Sharing</SelectItem>
                    <SelectItem value="Subscription">Subscription</SelectItem>
                    <SelectItem value="Long-term Lease">
                      Long-term Lease
                    </SelectItem>
                    <SelectItem value="Short-term Rental">
                      Short-term Rental
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Area</Label>
                <Input
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  placeholder="Islandwide"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tagline</Label>
              <Input
                value={form.tagline}
                onChange={(e) => set("tagline", e.target.value)}
                placeholder="Drive an EV without owning one"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            {/* Admin: assign dealer */}
            {isAdmin && (
              <div className="space-y-1.5">
                <Label>Assign to dealer</Label>
                <Select
                  value={form.dealerIdAdmin || "__none__"}
                  onValueChange={(v) =>
                    set("dealerIdAdmin", v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dealer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Unassigned —</SelectItem>
                    {dealers.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                  The dealer who owns this rental company.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing & terms */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Pricing & terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label>Price from</Label>
                <Input
                  value={form.priceFrom}
                  onChange={(e) => set("priceFrom", e.target.value)}
                  placeholder="S$80"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Period</Label>
                <Input
                  value={form.pricePeriod}
                  onChange={(e) => set("pricePeriod", e.target.value)}
                  placeholder="/day"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label>Min term</Label>
                <Input
                  value={form.minTerm}
                  onChange={(e) => set("minTerm", e.target.value)}
                  placeholder="1 day"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Deposit required</Label>
                <Input
                  value={form.depositRequired}
                  onChange={(e) => set("depositRequired", e.target.value)}
                  placeholder="S$500"
                />
              </div>
              <div className="space-y-1.5">
                <Label>License years required</Label>
                <Input
                  type="number"
                  value={form.requiresLicenseYears}
                  onChange={(e) => set("requiresLicenseYears", e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includesInsurance}
                  onChange={(e) => set("includesInsurance", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-500"
                />
                Includes insurance
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includesMaintenance}
                  onChange={(e) => set("includesMaintenance", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-500"
                />
                Includes maintenance
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Contact & ratings */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Contact & ratings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="6123 4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label>Rating (0–5)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={form.rating}
                  onChange={(e) => set("rating", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Review count</Label>
                <Input
                  type="number"
                  value={form.reviewCount}
                  onChange={(e) => set("reviewCount", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Features (one per line)</Label>
              <Textarea
                rows={4}
                value={form.featuresText}
                onChange={(e) => set("featuresText", e.target.value)}
                placeholder={
                  "Free charging\n24/7 roadside assistance\nNo cancellation fees"
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Fleet */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Fleet ({form.fleet.length})
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={addFleet}
              className="gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add car
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.fleet.length === 0 && (
              <p className="text-sm text-slate-400">
                No fleet cars yet. Click "Add car" to add one.
              </p>
            )}
            {form.fleet.map((f, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 p-4 space-y-3 relative"
              >
                <button
                  type="button"
                  onClick={() => removeFleet(i)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Model *</Label>
                    <Input
                      value={f.model}
                      onChange={(e) => setFleet(i, "model", e.target.value)}
                      placeholder="Tesla Model 3"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Body type</Label>
                    <Input
                      value={f.bodyType}
                      onChange={(e) => setFleet(i, "bodyType", e.target.value)}
                      placeholder="Sedan"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Price from</Label>
                    <Input
                      value={f.priceFrom}
                      onChange={(e) => setFleet(i, "priceFrom", e.target.value)}
                      placeholder="S$120"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Period</Label>
                    <Input
                      value={f.pricePeriod}
                      onChange={(e) =>
                        setFleet(i, "pricePeriod", e.target.value)
                      }
                      placeholder="/day"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Range (km)</Label>
                    <Input
                      type="number"
                      value={f.rangeKm}
                      onChange={(e) => setFleet(i, "rangeKm", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Seats</Label>
                    <Input
                      type="number"
                      value={f.seats}
                      onChange={(e) => setFleet(i, "seats", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">0–100 km/h</Label>
                    <Input
                      value={f.accel}
                      onChange={(e) => setFleet(i, "accel", e.target.value)}
                      placeholder="6.1s"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Charge time</Label>
                    <Input
                      value={f.chargeTime}
                      onChange={(e) =>
                        setFleet(i, "chargeTime", e.target.value)
                      }
                      placeholder="~30 min DC"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Image ID / URL</Label>
                    <Input
                      value={f.imageId}
                      onChange={(e) => setFleet(i, "imageId", e.target.value)}
                      placeholder="image key or URL"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-4 pb-8">
          <Link href={backHref}>
            <Button variant="outline" size="lg">
              Cancel
            </Button>
          </Link>
          <Button
            size="lg"
            className="gap-2 px-8"
            onClick={handleSave}
            disabled={isPending || !isValid}
          >
            {isPending ? (
              "Saving…"
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {editingId ? "Save changes" : "Create rental"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
