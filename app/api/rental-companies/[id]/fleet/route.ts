import { supabaseServer } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";

function toRow(b: Record<string, unknown>, rentalCompanyId: number) {
  return {
    rental_company_id: rentalCompanyId,
    model: b.model,
    image_id: (b.imageId as string | null) ?? null,
    gallery_images: Array.isArray(b.galleryImages) ? b.galleryImages : [],
    price_from: b.priceFrom ?? "",
    price_period: b.pricePeriod ?? "",
    range_km: b.rangeKm ?? 0,
    seats: b.seats ?? 5,
    accel: b.accel ?? "",
    charge_time: b.chargeTime ?? "",
    body_type: b.bodyType ?? "",
    description: b.description ?? "",
    promo_text: b.promoText ?? "",
    phv_requirements: Array.isArray(b.phvRequirements) ? b.phvRequirements : [],
    corporate_requirements: Array.isArray(b.corporateRequirements)
      ? b.corporateRequirements
      : [],
    types: Array.isArray(b.types) ? b.types : [],
    deposit_required: b.depositRequired ?? "",
    available: b.available === undefined ? true : !!b.available,
    status: b.status === "published" ? "published" : "draft",
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data, error } = await supabaseServer
    .from("rental_company_fleet")
    .select("*")
    .eq("rental_company_id", id)
    .order("id", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  if (!body.model || !String(body.model).trim()) {
    return NextResponse.json({ error: "Model is required" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("rental_company_fleet")
    .insert(toRow(body, Number(id)))
    .select()
    .single();

  if (error) {
    console.error("POST rental-company fleet:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
