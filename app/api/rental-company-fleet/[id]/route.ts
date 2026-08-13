import { supabaseServer } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";

// Sparse map — only include keys present in body
function toRow(b: Record<string, unknown>) {
  return {
    ...(b.model !== undefined && { model: b.model }),
    ...(b.imageId !== undefined && { image_id: b.imageId }),
    ...(b.galleryImages !== undefined && {
      gallery_images: Array.isArray(b.galleryImages) ? b.galleryImages : [],
    }),
    ...(b.priceFrom !== undefined && { price_from: b.priceFrom }),
    ...(b.pricePeriod !== undefined && { price_period: b.pricePeriod }),
    ...(b.rangeKm !== undefined && { range_km: b.rangeKm }),
    ...(b.seats !== undefined && { seats: b.seats }),
    ...(b.accel !== undefined && { accel: b.accel }),
    ...(b.chargeTime !== undefined && { charge_time: b.chargeTime }),
    ...(b.bodyType !== undefined && { body_type: b.bodyType }),
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
    .eq("id", id)
    .maybeSingle();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabaseServer
    .from("rental_company_fleet")
    .update(toRow(body))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("PATCH rental-company fleet:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { error } = await supabaseServer
    .from("rental_company_fleet")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
