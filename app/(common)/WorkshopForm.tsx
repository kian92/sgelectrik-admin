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
import { ArrowLeft, Wrench, CheckCircle2 } from "lucide-react";
import { Workshop, WorkshopFormState } from "../lib/workshop";

interface DealerOption {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  workshop?: Workshop;
  dealers: DealerOption[];
  isAdmin: boolean;
  sessionDealerId?: number; // logged-in dealer's id (used when role = dealer)
}

const EMPTY: WorkshopFormState = {
  name: "",
  slug: "",
  type: "Independent",
  area: "",
  address: "",
  phone: "",
  hours: "",
  description: "",
  since: "",
  servicesText: "",
  brandsText: "",
  certificationsText: "",
  rating: "0.0",
  reviewCount: "0",
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

export default function WorkshopForm({
  workshop,
  dealers,
  isAdmin,
  sessionDealerId,
}: Props) {
  const router = useRouter();
  const isEditing = !!workshop;

  // Dealers always use their own id — never show the dropdown
  const backHref = isAdmin ? "/admin/workshops" : "/dealer/workshops";

  const [form, setForm] = useState<WorkshopFormState>({
    ...EMPTY,
    // Pre-fill dealerId for dealer role so buildPayload always has it
    dealerId: sessionDealerId ? String(sessionDealerId) : "",
  });
  const [autoSlug, setAutoSlug] = useState(!isEditing);
  const [isSaving, setIsSaving] = useState(false);

  const set = (k: keyof WorkshopFormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Populate form when editing
  useEffect(() => {
    if (workshop) {
      setForm({
        name: workshop.name ?? "",
        slug: workshop.slug ?? "",
        type: workshop.type ?? "Independent",
        area: workshop.area ?? "",
        address: workshop.address ?? "",
        phone: workshop.phone ?? "",
        hours: workshop.hours ?? "",
        description: workshop.description ?? "",
        since: workshop.since ? String(workshop.since) : "",
        servicesText: parseJsonArray(workshop.services).join("\n"),
        brandsText: parseJsonArray(workshop.brands).join(", "),
        certificationsText: parseJsonArray(workshop.certifications).join("\n"),
        rating: String(workshop.rating ?? "0.0"),
        reviewCount: String(workshop.review_count ?? 0),
        status: workshop.status ?? "active",
        // For dealer role always keep their own id, even in edit
        dealerId: isAdmin
          ? String(workshop.dealer_id ?? "")
          : String(sessionDealerId ?? workshop.dealer_id ?? ""),
      });
    }
  }, [workshop, isAdmin, sessionDealerId]);

  // Auto-generate slug from name
  useEffect(() => {
    if (autoSlug && !isEditing) {
      set("slug", slugify(form.name));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name, autoSlug]);

  // Dealer role: dealerId is always pre-filled — only admin needs to pick one
  const isValid =
    form.name.trim().length > 0 &&
    form.slug.trim().length > 0 &&
    form.dealerId.trim().length > 0;

  function buildPayload() {
    return {
      dealer_id: Number(form.dealerId),
      name: form.name.trim(),
      slug: form.slug.trim(),
      type: form.type,
      area: form.area || null,
      address: form.address || null,
      phone: form.phone || null,
      hours: form.hours || null,
      description: form.description || null,
      since: form.since ? parseInt(form.since) : null,
      services: form.servicesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      brands: form.brandsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      certifications: form.certificationsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      rating: parseFloat(form.rating) || 0,
      review_count: parseInt(form.reviewCount) || 0,
      status: form.status,
    };
  }

  async function handleSubmit() {
    if (!isValid) return;
    setIsSaving(true);

    try {
      const url = isEditing
        ? `/api/workshops/${workshop!.id}`
        : "/api/workshops";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to save workshop");
      }

      toast({
        title: isEditing ? "Workshop updated" : "Workshop created",
        description: `${form.name} has been ${isEditing ? "updated" : "added"}.`,
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
            <ArrowLeft className="h-4 w-4" /> Back to Workshops
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Wrench className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? "Edit Workshop" : "Add Workshop"}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isAdmin
                ? "Admin · manage any workshop"
                : "Manage your workshop listing"}
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
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="EV Care Workshop"
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
                  placeholder="ev-care-workshop"
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
                    <SelectItem value="Authorised">Authorised</SelectItem>
                    <SelectItem value="Independent">Independent</SelectItem>
                    <SelectItem value="Specialist">Specialist</SelectItem>
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
                  The dealer who owns this workshop.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location & Contact */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Location &amp; contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  placeholder="Ubi"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="6123 4567"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                placeholder="123 Ubi Road"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                value={form.hours}
                onChange={(e) => set("hours", e.target.value)}
                placeholder="Mon–Sat 9am – 6pm"
              />
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
                placeholder="Describe the workshop, expertise, what makes it stand out…"
              />
            </div>
            <div className="grid grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="since">Established (year)</Label>
                <Input
                  id="since"
                  type="number"
                  value={form.since}
                  onChange={(e) => set("since", e.target.value)}
                  placeholder="2015"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rating">Rating (0–5)</Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={form.rating}
                  onChange={(e) => set("rating", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reviewCount">Review count</Label>
                <Input
                  id="reviewCount"
                  type="number"
                  value={form.reviewCount}
                  onChange={(e) => set("reviewCount", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services, Brands, Certifications */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Services, brands &amp; certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="services">Services (one per line)</Label>
              <Textarea
                id="services"
                rows={4}
                value={form.servicesText}
                onChange={(e) => set("servicesText", e.target.value)}
                placeholder="Battery diagnostics\nMotor servicing\nTyre replacement"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brands">Brands serviced (comma-separated)</Label>
              <Input
                id="brands"
                value={form.brandsText}
                onChange={(e) => set("brandsText", e.target.value)}
                placeholder="Tesla, BYD, Hyundai"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="certifications">
                Certifications (one per line)
              </Label>
              <Textarea
                id="certifications"
                rows={3}
                value={form.certificationsText}
                onChange={(e) => set("certificationsText", e.target.value)}
                placeholder="LTA-approved EV technician\nManufacturer-trained"
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
                {isEditing ? "Save changes" : "Create workshop"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
