"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Pencil,
  CheckCircle2,
  Loader2,
  ImageIcon,
} from "lucide-react";

export interface ListingData {
  id: string;
  brand: string;
  model: string;
  carType: string;
  condition: string;
  priceMin: number;
  priceMax: number;
  rangeKm: number;
  seats: number;
  topSpeed: number;
  acceleration: string;
  chargingTimeFast: string;
  chargingTimeSlow: string;
  rebateEligible: boolean;
  rebateAmount: number | null;
  highlights: string;
  description: string;
  monthlyEstimate: number;
  year: number | null;
  mileage: number | null;
  imageUrl: string | null;
}

type FormState = {
  brand: string;
  model: string;
  carType: string;
  condition: string;
  priceMin: string;
  priceMax: string;
  rangeKm: string;
  seats: string;
  topSpeed: string;
  acceleration: string;
  chargingTimeFast: string;
  chargingTimeSlow: string;
  rebateEligible: boolean;
  rebateAmount: string;
  highlights: string;
  description: string;
  monthlyEstimate: string;
  year: string;
  mileage: string;
  imageUrl: string;
};

function listingToForm(l: ListingData): FormState {
  let hl = "";
  try {
    hl = JSON.parse(l.highlights).join("\n");
  } catch {}
  return {
    brand: l.brand,
    model: l.model,
    carType: l.carType,
    condition: l.condition,
    priceMin: String(l.priceMin),
    priceMax: String(l.priceMax),
    rangeKm: String(l.rangeKm),
    seats: String(l.seats),
    topSpeed: String(l.topSpeed),
    acceleration: l.acceleration,
    chargingTimeFast: l.chargingTimeFast,
    chargingTimeSlow: l.chargingTimeSlow,
    rebateEligible: l.rebateEligible,
    rebateAmount: l.rebateAmount ? String(l.rebateAmount) : "",
    highlights: hl,
    description: l.description,
    monthlyEstimate: String(l.monthlyEstimate),
    year: l.year ? String(l.year) : "",
    mileage: l.mileage ? String(l.mileage) : "",
    imageUrl: l.imageUrl ?? "",
  };
}

function Field({
  label,
  field,
  type = "text",
  placeholder = "",
  hint,
  form,
  set,
}: {
  label: string;
  field: keyof FormState;
  type?: string;
  placeholder?: string;
  hint?: string;
  form: FormState;
  set: (k: keyof FormState, v: string | boolean) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <Input
        type={type}
        value={form[field] as string}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        className="h-10"
      />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

interface Props {
  listing: ListingData;
  dealerName: string;
}

export function EditListingForm({ listing, dealerName }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setFormState] = useState<FormState>(() =>
    listingToForm(listing),
  );
  const [isPending, setIsPending] = useState(false);

  const set = (k: keyof FormState, v: string | boolean) =>
    setFormState((f) => ({ ...f, [k]: v }));

  const isValid = form.brand && form.model && form.priceMin && form.rangeKm;

  const handleSave = async () => {
    if (!isValid) return;
    setIsPending(true);
    try {
      const highlights = form.highlights
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/dealer-listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: form.brand,
          model: form.model,
          carType: form.carType,
          condition: form.condition,
          priceMin: parseInt(form.priceMin) || 0,
          priceMax: parseInt(form.priceMax) || parseInt(form.priceMin) || 0,
          rangeKm: parseInt(form.rangeKm) || 0,
          seats: parseInt(form.seats) || 5,
          topSpeed: parseInt(form.topSpeed) || 0,
          acceleration: form.acceleration,
          chargingTimeFast: form.chargingTimeFast,
          chargingTimeSlow: form.chargingTimeSlow,
          rebateEligible: form.rebateEligible,
          rebateAmount: form.rebateAmount ? parseInt(form.rebateAmount) : null,
          highlights: JSON.stringify(highlights),
          description: form.description,
          monthlyEstimate: parseInt(form.monthlyEstimate) || 0,
          year: form.year ? parseInt(form.year) : null,
          mileage: form.mileage ? parseInt(form.mileage) : null,
          imageUrl: form.imageUrl || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save");
      }

      toast({
        title: "Listing updated!",
        description: `${form.brand} ${form.model} saved.`,
      });
      router.push("/dealer/listings");
    } catch (err: unknown) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dealer/listings">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-500 hover:text-slate-700 -ml-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to My Listings
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Pencil className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Listing</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {listing.brand} {listing.model} · {dealerName}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Vehicle Details */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Vehicle details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <Field
                label="Brand *"
                field="brand"
                placeholder="e.g. Toyota"
                form={form}
                set={set}
              />
              <Field
                label="Model *"
                field="model"
                placeholder="e.g. bZ4X"
                form={form}
                set={set}
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Car type *
                </Label>
                <Select
                  value={form.carType}
                  onValueChange={(v) => set("carType", v)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Sedan", "SUV", "Hatchback", "MPV"].map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Condition *
                </Label>
                <Select
                  value={form.condition}
                  onValueChange={(v) => set("condition", v)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="used">Pre-owned / Used</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.condition === "used" && (
              <div className="grid grid-cols-2 gap-5">
                <Field
                  label="Year of manufacture"
                  field="year"
                  type="number"
                  placeholder="2022"
                  form={form}
                  set={set}
                />
                <Field
                  label="Mileage (km)"
                  field="mileage"
                  type="number"
                  placeholder="25000"
                  form={form}
                  set={set}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Car Photo */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Car photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">
                Image URL
              </Label>
              <Input
                type="url"
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                placeholder="https://example.com/car-photo.jpg"
                className="h-10"
              />
              <p className="text-xs text-slate-400">
                Paste a direct link to a car photo (JPEG or PNG).
              </p>
            </div>
            {form.imageUrl ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 aspect-[16/9] bg-slate-100">
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 aspect-[16/9] flex flex-col items-center justify-center gap-2 bg-slate-50">
                <ImageIcon className="h-8 w-8 text-slate-300" />
                <p className="text-xs text-slate-400">
                  Image preview will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <Field
                label="Starting price (S$) *"
                field="priceMin"
                type="number"
                placeholder="148000"
                hint="Lowest variant / base price"
                form={form}
                set={set}
              />
              <Field
                label="Top price (S$)"
                field="priceMax"
                type="number"
                placeholder="168000"
                hint="Highest variant, or same as starting"
                form={form}
                set={set}
              />
            </div>
            <Field
              label="Estimated monthly cost (S$)"
              field="monthlyEstimate"
              type="number"
              placeholder="1800"
              hint="Loan repayment + running costs estimate"
              form={form}
              set={set}
            />
            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="rebate-edit"
                  checked={form.rebateEligible}
                  onChange={(e) => set("rebateEligible", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-500"
                />
                <Label
                  htmlFor="rebate-edit"
                  className="text-sm font-medium cursor-pointer"
                >
                  Eligible for VES rebate
                </Label>
              </div>
              {form.rebateEligible && (
                <Field
                  label="Rebate amount (S$)"
                  field="rebateAmount"
                  type="number"
                  placeholder="25000"
                  form={form}
                  set={set}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Performance & range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-3 gap-5">
              <Field
                label="Range (km) *"
                field="rangeKm"
                type="number"
                placeholder="420"
                hint="WLTP or manufacturer rated"
                form={form}
                set={set}
              />
              <Field
                label="Top speed (km/h)"
                field="topSpeed"
                type="number"
                placeholder="160"
                form={form}
                set={set}
              />
              <Field
                label="Seats"
                field="seats"
                type="number"
                placeholder="5"
                form={form}
                set={set}
              />
            </div>
            <Field
              label="Acceleration"
              field="acceleration"
              placeholder="e.g. 7.3s 0-100 km/h"
              form={form}
              set={set}
            />
          </CardContent>
        </Card>

        {/* Charging */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Charging
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <Field
                label="Fast charging time"
                field="chargingTimeFast"
                placeholder="~50 min (80%)"
                hint="DC fast charge to 80%"
                form={form}
                set={set}
              />
              <Field
                label="Slow / AC charging time"
                field="chargingTimeSlow"
                placeholder="~8 hrs (AC)"
                hint="Home AC charge to 100%"
                form={form}
                set={set}
              />
            </div>
          </CardContent>
        </Card>

        {/* Highlights & Description */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Highlights & description
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">
                Key highlights
              </Label>
              <Textarea
                value={form.highlights}
                onChange={(e) => set("highlights", e.target.value)}
                placeholder={
                  "420km range\nBlade Battery safety\nFast charging support"
                }
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-slate-400">One highlight per line.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">
                Description
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Tell buyers what makes this vehicle special..."
                rows={5}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 pb-8">
          <Link href="/dealer/listings">
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
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> Save changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
