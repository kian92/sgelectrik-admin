"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/FileUpload";
import { GalleryGrid } from "@/components/GalleryGrid";
import type { FleetCar } from "./FleetCarCard";

interface Props {
  rentalCompanyId: number;
  existing?: FleetCar;
  onSaved: (car: FleetCar) => void;
  onCancel: () => void;
}

function buildInitialForm(existing?: FleetCar) {
  return {
    model: existing?.model ?? "",
    imageId: existing?.image_id ?? "",
    galleryImages: existing?.gallery_images ?? ([] as string[]),
    priceFrom: existing?.price_from ?? "",
    pricePeriod: existing?.price_period ?? "/day",
    rangeKm: existing ? String(existing.range_km ?? 0) : "0",
    seats: existing ? String(existing.seats ?? 5) : "5",
    accel: existing?.accel ?? "",
    chargeTime: existing?.charge_time ?? "",
    bodyType: existing?.body_type ?? "",
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.model.trim()) return;

    const body = {
      model: form.model.trim(),
      imageId: form.imageId || null,
      galleryImages: form.galleryImages,
      priceFrom: form.priceFrom,
      pricePeriod: form.pricePeriod,
      rangeKm: parseInt(form.rangeKm) || 0,
      seats: parseInt(form.seats) || 5,
      accel: form.accel,
      chargeTime: form.chargeTime,
      bodyType: form.bodyType,
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
          <div className="space-y-1">
            <Label className="text-xs">Charge time</Label>
            <Input
              value={form.chargeTime}
              onChange={(e) => set("chargeTime", e.target.value)}
              placeholder="~30 min DC"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Main image</Label>
            {form.imageId ? (
              <div className="relative rounded-xl overflow-hidden bg-slate-100 h-32 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imageId}
                  alt="Main preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => set("imageId", "")}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                  aria-label="Remove main image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
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
      </CardContent>
    </Card>
  );
}
