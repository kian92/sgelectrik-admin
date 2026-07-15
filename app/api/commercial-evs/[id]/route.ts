import { supabaseServer } from "@/app/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { data, error } = await supabaseServer
    .from("commercial_evs")
    .select("*")
    .eq("id", parseInt(id))
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Commercial EV not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabaseServer
    .from("commercial_evs")
    .update(toRow(body))
    .eq("id", parseInt(id))
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Commercial EV not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { error } = await supabaseServer
    .from("commercial_evs")
    .delete()
    .eq("id", parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}

// ─── Sparse map — only include keys present in body ───────────────────────────
function toRow(b: Record<string, unknown>) {
  return {
    ...(b.name !== undefined && { name: b.name }),
    ...(b.brand !== undefined && { brand: b.brand }),
    ...(b.model !== undefined && { model: b.model }),
    ...(b.slug !== undefined && { slug: b.slug }),
    ...(b.category !== undefined && { category: b.category }),
    ...(b.year !== undefined && { year: b.year }),
    ...(b.dealerId !== undefined && { dealer_id: b.dealerId }),
    ...(b.dealerSlug !== undefined && { dealer_slug: b.dealerSlug }),
    ...(b.priceMin !== undefined && { price_min: b.priceMin }),
    ...(b.priceMax !== undefined && { price_max: b.priceMax }),
    ...(b.rangeKm !== undefined && { range_km: b.rangeKm }),
    ...(b.payloadKg !== undefined && { payload_kg: b.payloadKg }),
    ...(b.chargingTimeFast !== undefined && {
      charging_time_fast: b.chargingTimeFast,
    }),
    ...(b.chargingTimeSlow !== undefined && {
      charging_time_slow: b.chargingTimeSlow,
    }),
    ...(b.imageUrl !== undefined && { image_url: b.imageUrl }),
    ...(b.galleryImages !== undefined && {
      gallery_images: Array.isArray(b.galleryImages) ? b.galleryImages : [],
    }),
    ...(b.description !== undefined && { description: b.description }),
    ...(b.highlights !== undefined && { highlights: b.highlights }),
    ...(b.status !== undefined && { status: b.status }),
  };
}
