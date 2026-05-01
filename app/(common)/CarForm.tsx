"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Car, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DealerOption {
  id: number;
  slug: string;
  name: string;
}

interface ExistingCar {
  id: string;
  name: string;
  brand: string;
  model: string;
  price_min: number;
  price_max: number;
  range_km: number;
  car_type?: string;
  charging_time_fast?: string;
  charging_time_slow?: string;
  rebate_eligible?: boolean;
  rebate_amount?: number | null;
  acceleration?: string;
  top_speed?: number;
  seats?: number;
  highlights?: string;
  monthly_estimate?: number;
  description?: string;
  condition?: string;
  year?: number | null;
  mileage?: number | null;
  image_url?: string;
}

type Props =
  | {
      role: "admin";
      dealers: DealerOption[];
      dealerId?: never;
      dealerSlug?: never;
      existing?: ExistingCar;
      backHref: string;
    }
  | {
      role: "dealer";
      dealerId: number;
      dealerSlug: string;
      dealers?: never;
      existing?: ExistingCar;
      backHref: string;
    };

// ─── Constants ────────────────────────────────────────────────────────────────

const CAR_TYPES = [
  "Sedan",
  "SUV",
  "Hatchback",
  "MPV",
  "Coupe",
  "Wagon",
  "Other",
];
const CONDITIONS = ["new", "used"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function buildInitialForm(existing?: ExistingCar) {
  if (!existing) {
    return {
      id: "",
      name: "",
      brand: "",
      model: "",
      carType: "Sedan",
      condition: "new",
      year: "",
      mileage: "",
      priceMin: "",
      priceMax: "",
      rangeKm: "",
      chargingTimeFast: "",
      chargingTimeSlow: "",
      rebateEligible: false,
      rebateAmount: "",
      acceleration: "",
      topSpeed: "",
      seats: "5",
      monthlyEstimate: "",
      imageUrl: "",
      description: "",
      highlights: "",
      dealerKey: "",
    };
  }

  return {
    id: existing.id ?? "",
    name: existing.name ?? "",
    brand: existing.brand ?? "",
    model: existing.model ?? "",
    carType: existing.car_type ?? "Sedan",
    condition: existing.condition ?? "new",
    year: existing.year != null ? String(existing.year) : "",
    mileage: existing.mileage != null ? String(existing.mileage) : "",
    priceMin: existing.price_min != null ? String(existing.price_min) : "",
    priceMax: existing.price_max != null ? String(existing.price_max) : "",
    rangeKm: existing.range_km != null ? String(existing.range_km) : "",
    chargingTimeFast: existing.charging_time_fast ?? "",
    chargingTimeSlow: existing.charging_time_slow ?? "",
    rebateEligible: existing.rebate_eligible ?? false,
    rebateAmount:
      existing.rebate_amount != null ? String(existing.rebate_amount) : "",
    acceleration: existing.acceleration ?? "",
    topSpeed: existing.top_speed != null ? String(existing.top_speed) : "",
    seats: existing.seats != null ? String(existing.seats) : "5",
    monthlyEstimate:
      existing.monthly_estimate != null
        ? String(existing.monthly_estimate)
        : "",
    imageUrl: existing.image_url ?? "",
    description: existing.description ?? "",
    highlights: parseHighlights(existing.highlights),
    dealerKey: "",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CarForm({
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
  const [autoId, setAutoId] = useState(!existing);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const highlightsArr = form.highlights
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

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
      id: slugify(form.id),
      name: form.name,
      brand: form.brand,
      model: form.model,
      carType: form.carType,
      condition: form.condition,
      year: form.year ? parseInt(form.year) : null,
      mileage: form.mileage ? parseInt(form.mileage) : null,
      priceMin: parseInt(form.priceMin) || 0,
      priceMax: parseInt(form.priceMax) || 0,
      rangeKm: parseInt(form.rangeKm) || 0,
      chargingTimeFast: form.chargingTimeFast,
      chargingTimeSlow: form.chargingTimeSlow,
      rebateEligible: form.rebateEligible,
      rebateAmount: form.rebateAmount ? parseInt(form.rebateAmount) : null,
      acceleration: form.acceleration,
      topSpeed: parseInt(form.topSpeed) || 0,
      seats: parseInt(form.seats) || 5,
      monthlyEstimate: parseInt(form.monthlyEstimate) || 0,
      imageUrl: form.imageUrl,
      description: form.description,
      highlights: JSON.stringify(highlightsArr),
      dealerId: resolvedDealerId,
      dealerSlug: resolvedDealerSlug,
    };

    startTransition(async () => {
      const url = isEdit ? `/api/cars/${existing!.id}` : "/api/cars";
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

      toast({ title: isEdit ? "Car updated" : "Car created" });
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
            <Car className="h-6 w-6 text-emerald-600" />
            {isEdit ? "Edit car" : "Add car"}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isEdit
              ? "Update details for this listing"
              : "Create a new car listing"}
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
              {/* ID — only for new cars; locked on edit */}
              <div className="space-y-1.5 col-span-2">
                <Label>
                  ID (slug) <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={form.id}
                  readOnly={isEdit}
                  onChange={(e) => {
                    setAutoId(false);
                    set("id", e.target.value);
                  }}
                  placeholder="e.g. byd-atto-3-2024"
                  className={
                    isEdit
                      ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                      : ""
                  }
                />
                {!isEdit && (
                  <p className="text-xs text-slate-400">
                    Unique identifier — auto-filled from name, or set manually.
                  </p>
                )}
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label>
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (autoId && !isEdit) set("id", slugify(e.target.value));
                  }}
                  placeholder="e.g. BYD Atto 3"
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
                  placeholder="e.g. Atto 3"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Car type</Label>
                <Select
                  value={form.carType}
                  onValueChange={(v) => set("carType", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAR_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Condition</Label>
                <Select
                  value={form.condition}
                  onValueChange={(v) => set("condition", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <div className="space-y-1.5">
                <Label>Mileage (km)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.mileage}
                  onChange={(e) => set("mileage", e.target.value)}
                  placeholder="0 for new"
                />
              </div>
            </div>

            {/* Dealer picker — admin only */}
            {role === "admin" && dealers && (
              <div className="space-y-1.5">
                <Label>
                  Assign to dealer <span className="text-red-500">*</span>
                </Label>
                <Select
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

        {/* ── Pricing ── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  Price min (S$) <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  type="number"
                  min="0"
                  value={form.priceMin}
                  onChange={(e) => set("priceMin", e.target.value)}
                  placeholder="80000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Price max (S$) <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  type="number"
                  min="0"
                  value={form.priceMax}
                  onChange={(e) => set("priceMax", e.target.value)}
                  placeholder="100000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Monthly estimate (S$)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.monthlyEstimate}
                  onChange={(e) => set("monthlyEstimate", e.target.value)}
                  placeholder="1500"
                />
              </div>
            </div>

            {/* Rebate */}
            <div className="flex items-center gap-3 pt-1">
              <Checkbox
                id="rebate"
                checked={form.rebateEligible}
                onCheckedChange={(v) => set("rebateEligible", !!v)}
              />
              <Label htmlFor="rebate" className="cursor-pointer font-normal">
                EV rebate eligible
              </Label>
            </div>
            {form.rebateEligible && (
              <div className="space-y-1.5">
                <Label>Rebate amount (S$)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.rebateAmount}
                  onChange={(e) => set("rebateAmount", e.target.value)}
                  placeholder="15000"
                />
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
                <Label>
                  Range (km) <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  type="number"
                  min="0"
                  value={form.rangeKm}
                  onChange={(e) => set("rangeKm", e.target.value)}
                  placeholder="400"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Seats</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={form.seats}
                  onChange={(e) => set("seats", e.target.value)}
                  placeholder="5"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Acceleration (0–100 km/h)</Label>
                <Input
                  value={form.acceleration}
                  onChange={(e) => set("acceleration", e.target.value)}
                  placeholder="e.g. 7.3s"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Top speed (km/h)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.topSpeed}
                  onChange={(e) => set("topSpeed", e.target.value)}
                  placeholder="160"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fast charging time</Label>
                <Input
                  value={form.chargingTimeFast}
                  onChange={(e) => set("chargingTimeFast", e.target.value)}
                  placeholder="e.g. 30 min (DC 80 kW)"
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
                placeholder="Overview of this car..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Highlights</Label>
              <Input
                value={form.highlights}
                onChange={(e) => set("highlights", e.target.value)}
                placeholder="e.g. Low running cost, Zero emissions, Fast charging"
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
                <CheckCircle2 className="h-4 w-4" />
                {isEdit ? "Save changes" : "Create listing"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
