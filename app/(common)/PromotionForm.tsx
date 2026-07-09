"use client";

import { useState, useEffect } from "react";
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
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Tag, CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import { Promotion, PromotionFormState } from "../lib/promotion";

interface DealerOption {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  promotion?: Promotion;
  dealers: DealerOption[];
  isAdmin: boolean;
  sessionDealerId?: number; // logged-in dealer's id (used when role = dealer)
}

const EMPTY: PromotionFormState = {
  title: "",
  slug: "",
  venue: "",
  area: "",
  startDate: "",
  endDate: "",
  timeRange: "",
  perksText: "",
  image: "",
  description: "",
  status: "active",
  dealerId: "",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseJsonArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  try {
    const parsed = JSON.parse(raw as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function PromotionForm({
  promotion,
  dealers,
  isAdmin,
  sessionDealerId,
}: Props) {
  const router = useRouter();
  const isEditing = !!promotion;

  const backHref = isAdmin ? "/admin/promotions" : "/dealer/promotions";

  const [form, setForm] = useState<PromotionFormState>({
    ...EMPTY,
    // Pre-fill dealerId for dealer role so buildPayload always has it
    dealerId: sessionDealerId ? String(sessionDealerId) : "",
  });
  const [autoSlug, setAutoSlug] = useState(!isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const set = (k: keyof PromotionFormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Populate form when editing
  useEffect(() => {
    if (promotion) {
      setForm({
        title: promotion.title ?? "",
        slug: promotion.slug ?? "",
        venue: promotion.venue ?? "",
        area: promotion.area ?? "",
        startDate: promotion.start_date ?? "",
        endDate: promotion.end_date ?? "",
        timeRange: promotion.time_range ?? "",
        perksText: parseJsonArray(promotion.perks).join("\n"),
        image: promotion.image ?? "",
        description: promotion.description ?? "",
        status: promotion.status ?? "active",
        // For dealer role always keep their own id, even in edit
        dealerId: isAdmin
          ? String(promotion.dealer_id ?? "")
          : String(sessionDealerId ?? promotion.dealer_id ?? ""),
      });
    }
  }, [promotion, isAdmin, sessionDealerId]);

  // Auto-generate slug from title
  useEffect(() => {
    if (autoSlug && !isEditing) {
      set("slug", slugify(form.title));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, autoSlug]);

  // Dealer role: dealerId is always pre-filled — only admin needs to pick one
  const isValid =
    form.title.trim().length > 0 &&
    form.slug.trim().length > 0 &&
    form.dealerId.trim().length > 0 &&
    form.startDate.trim().length > 0 &&
    form.endDate.trim().length > 0 &&
    form.endDate >= form.startDate;

  function buildPayload() {
    return {
      dealer_id: Number(form.dealerId),
      title: form.title.trim(),
      slug: form.slug.trim(),
      venue: form.venue || null,
      area: form.area || null,
      start_date: form.startDate,
      end_date: form.endDate,
      time_range: form.timeRange || null,
      perks: form.perksText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      image: form.image || null,
      description: form.description || null,
      status: form.status,
    };
  }

  async function handleImageUpload(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("contentType", "general");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Failed to upload image");
      }

      set("image", json.url);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit() {
    if (!isValid) return;
    setIsSaving(true);

    try {
      const url = isEditing
        ? `/api/promotions/${promotion!.id}`
        : "/api/promotions";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to save promotion");
      }

      toast({
        title: isEditing ? "Promotion updated" : "Promotion created",
        description: `${form.title} has been ${isEditing ? "updated" : "added"}.`,
      });

      router.push(backHref);
      router.refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-full mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <Link href={backHref}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-500 hover:text-slate-700 -ml-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Promotions
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Tag className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? "Edit Promotion" : "Add Promotion"}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isAdmin
                ? "Admin · manage any dealer's promotion"
                : "Manage your roadshow or promotion listing"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Basic information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Tesla Weekend Roadshow"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    set("slug", e.target.value);
                  }}
                  placeholder="tesla-vivocity-roadshow"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                Inactive promotions are hidden from the public site regardless
                of dates.
              </p>
            </div>

            {/* Dealer assignment — admin only */}
            {isAdmin && (
              <div className="space-y-1.5">
                <Label>Assign to dealer *</Label>
                <Select
                  value={form.dealerId || "__none__"}
                  onValueChange={(v) =>
                    set("dealerId", v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dealer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Select dealer —</SelectItem>
                    {dealers.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                  The dealer running this promotion.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schedule & Venue */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Schedule &amp; venue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                />
                {form.endDate &&
                  form.startDate &&
                  form.endDate < form.startDate && (
                    <p className="text-xs text-red-500">
                      End date must be on or after the start date.
                    </p>
                  )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timeRange">Time range</Label>
              <Input
                id="timeRange"
                value={form.timeRange}
                onChange={(e) => set("timeRange", e.target.value)}
                placeholder="10am – 8pm"
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={form.venue}
                  onChange={(e) => set("venue", e.target.value)}
                  placeholder="VivoCity, Level 1 Atrium"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  placeholder="HarbourFront"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the event, what visitors can expect…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image">Image</Label>
              {form.image ? (
                <div className="relative w-full max-w-xs">
                  <img
                    src={form.image}
                    alt="Promotion"
                    className="w-full aspect-video object-cover rounded-xl border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => set("image", "")}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center gap-2 w-full max-w-xs aspect-video rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-500 cursor-pointer transition"
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="h-6 w-6" />
                      <span className="text-xs font-medium">Click to upload image</span>
                    </>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
              <p className="text-xs text-slate-400">
                Used as the card image on the public promotions page.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="perks">Perks (one per line)</Label>
              <Textarea
                id="perks"
                rows={4}
                value={form.perksText}
                onChange={(e) => set("perksText", e.target.value)}
                placeholder="Free test drives&#10;On-site trade-in valuation&#10;$500 gift voucher on booking"
              />
            </div>
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
            onClick={handleSubmit}
            disabled={isSaving || !isValid}
          >
            {isSaving ? (
              "Saving…"
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {isEditing ? "Save changes" : "Create promotion"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
