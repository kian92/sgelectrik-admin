"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/FileUpload";
import { GalleryGrid } from "@/components/GalleryGrid";
import type { FleetCar } from "./FleetCarCard";
import { FaqSection } from "./FaqSection";

const RENTAL_TYPE_OPTIONS = [
  "Car Sharing",
  "Subscription",
  "Long-term Lease",
  "Short-term Rental",
];

interface Props {
  rentalCompanyId: number;
  existing?: FleetCar;
  onSaved: (car: FleetCar) => void;
  onCancel: () => void;
}

function buildInitialForm(existing?: FleetCar) {
  return {
    model: existing?.model ?? "",
    description: existing?.description ?? "",
    types: existing?.types ?? ([] as string[]),
    imageId: existing?.image_id ?? "",
    galleryImages: existing?.gallery_images ?? ([] as string[]),
    priceFrom: existing?.price_from ?? "",
    pricePeriod: existing?.price_period ?? "/day",
    rangeKm: existing ? String(existing.range_km ?? 0) : "0",
    seats: existing ? String(existing.seats ?? 5) : "5",
    accel: existing?.accel ?? "",
    chargeTime: existing?.charge_time ?? "",
    bodyType: existing?.body_type ?? "",
    depositRequired: existing?.deposit_required ?? "",
    phvRequirementsText: (existing?.phv_requirements ?? []).join("\n"),
    corporateRequirementsText: (existing?.corporate_requirements ?? []).join(
      "\n",
    ),
    promoText: existing?.promo_text ?? "",
    available: existing?.available ?? true,
    status: existing?.status ?? "draft",
  };
}

export function FleetCarForm({
  rentalCompanyId,
  existing,
  onSaved,
  onCancel,
}: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!existing;
  const [form, setForm] = useState(() => buildInitialForm(existing));

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function removeGalleryImage(index: number) {
    setForm((f) => ({
      ...f,
      galleryImages: f.galleryImages.filter((_, i) => i !== index),
    }));
  }

  function toggleType(v: string) {
    setForm((f) => ({
      ...f,
      types: f.types.includes(v)
        ? f.types.filter((t) => t !== v)
        : [...f.types, v],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.model.trim()) return;

    const body = {
      model: form.model.trim(),
      description: form.description.trim(),
      types: form.types,
      imageId: form.imageId || null,
      galleryImages: form.galleryImages,
      priceFrom: form.priceFrom,
      pricePeriod: form.pricePeriod,
      rangeKm: parseInt(form.rangeKm) || 0,
      seats: parseInt(form.seats) || 5,
      accel: form.accel,
      chargeTime: form.chargeTime,
      bodyType: form.bodyType,
      depositRequired: form.depositRequired,
      phvRequirements: form.phvRequirementsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      corporateRequirements: form.corporateRequirementsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      promoText: form.promoText.trim(),
      available: form.available,
      status: form.status,
    };

    startTransition(async () => {
      const url = isEdit
        ? `/api/rental-company-fleet/${existing!.id}`
        : `/api/rental-companies/${rentalCompanyId}/fleet`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        toast({ title: err.error ?? "Failed to save", variant: "destructive" });
        return;
      }

      const saved = await res.json();
      toast({ title: isEdit ? "Fleet car updated" : "Fleet car added" });
      onSaved(saved);
    });
  }

  return (
    <Card className="border-0 shadow-sm ring-1 ring-emerald-200">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          {isEdit ? "Edit fleet car" : "Add fleet car"}
        </CardTitle>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Model *</Label>
              <Input
                value={form.model}
                onChange={(e) => set("model", e.target.value)}
                placeholder="Tesla Model 3"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Body type</Label>
              <Input
                value={form.bodyType}
                onChange={(e) => set("bodyType", e.target.value)}
                placeholder="Sedan"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe this specific vehicle..."
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Rental type(s)</Label>
            <div className="flex flex-wrap gap-2">
              {RENTAL_TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.types.includes(t)
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Price from</Label>
              <Input
                value={form.priceFrom}
                onChange={(e) => set("priceFrom", e.target.value)}
                placeholder="S$120"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Period</Label>
              <Input
                value={form.pricePeriod}
                onChange={(e) => set("pricePeriod", e.target.value)}
                placeholder="/day"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Range (km)</Label>
              <Input
                type="number"
                value={form.rangeKm}
                onChange={(e) => set("rangeKm", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Seats</Label>
              <Input
                type="number"
                value={form.seats}
                onChange={(e) => set("seats", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">0–100 km/h</Label>
              <Input
                value={form.accel}
                onChange={(e) => set("accel", e.target.value)}
                placeholder="6.1s"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Charge time</Label>
              <Input
                value={form.chargeTime}
                onChange={(e) => set("chargeTime", e.target.value)}
                placeholder="~30 min DC"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Deposit</Label>
              <Input
                value={form.depositRequired}
                onChange={(e) => set("depositRequired", e.target.value)}
                placeholder="S$500 — leave blank to use company default"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              PHV leasing requirements (one per line)
            </Label>
            <Textarea
              rows={3}
              value={form.phvRequirementsText}
              onChange={(e) => set("phvRequirementsText", e.target.value)}
              placeholder={
                "Valid PHV license\n23 years old and above\nMax 3 demerit points"
              }
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              Consumer / corporate leasing requirements (one per line)
            </Label>
            <Textarea
              rows={3}
              value={form.corporateRequirementsText}
              onChange={(e) =>
                set("corporateRequirementsText", e.target.value)
              }
              placeholder={"Valid driving license\n23 years old and above"}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Promo badge (optional)</Label>
            <Input
              value={form.promoText}
              onChange={(e) => set("promoText", e.target.value)}
              placeholder="Up to 29% off EV charging"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <div className="flex flex-wrap gap-2">
              {(["draft", "published"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.status === s
                      ? s === "published"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {s === "draft" ? "Draft" : "Published"}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Draft cars are hidden from the public site until published.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => set("available", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-emerald-500"
            />
            Currently available for rent
          </label>

          <div className="space-y-2">
            <Label className="text-xs">Main image</Label>
            {form.imageId ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                <div className="relative rounded-lg overflow-hidden bg-slate-100 aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageId}
                    alt="Main preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => set("imageId", "")}
                    className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                    aria-label="Remove main image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : null}
            <ImageUpload
              contentType="rentals"
              onUploadComplete={(url) => set("imageId", url)}
              label="Upload vehicle image"
              description="Click or drag to upload"
            />
            <Input
              value={form.imageId}
              onChange={(e) => set("imageId", e.target.value)}
              placeholder="Or paste an image URL"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Gallery images</Label>
            <p className="text-xs text-slate-400">
              Add extra photos — drag to reorder.
            </p>
            <GalleryGrid
              images={form.galleryImages}
              onReorder={(images) => set("galleryImages", images)}
              onRemove={removeGalleryImage}
            />
            <ImageUpload
              contentType="rentals"
              onUploadComplete={(url) =>
                set("galleryImages", [...form.galleryImages, url])
              }
              label="Add gallery image"
              description="Upload additional photos for this vehicle."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !form.model.trim()}
              className="gap-2"
            >
              {isPending ? (
                "Saving…"
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {isEdit ? "Save changes" : "Add car"}
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <FaqSection
            fleetCarId={existing?.id ?? null}
            initialFaqs={existing?.rental_company_faqs ?? []}
          />
        </div>
      </CardContent>
    </Card>
  );
}
