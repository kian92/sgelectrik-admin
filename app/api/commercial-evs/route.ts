import { supabaseServer } from "@/app/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dealerSlug = searchParams.get("dealerSlug");
  const dealerId = searchParams.get("dealerId");

  let query = supabaseServer
    .from("commercial_evs")
    .select("*")
    .order("created_at", { ascending: false });

  if (dealerId) query = query.eq("dealer_id", parseInt(dealerId));
  if (dealerSlug) query = query.eq("dealer_slug", dealerSlug);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { data, error } = await supabaseServer
    .from("commercial_evs")
    .insert([toRow(body)])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}

// ─── Map camelCase body → snake_case DB columns ───────────────────────────────
function toRow(b: Record<string, unknown>) {
  return {
    name: b.name,
    brand: b.brand,
    model: b.model,
    slug: b.slug,
    category: b.category ?? "Van",
    year: b.year ?? null,
    dealer_id: b.dealerId, // required FK
    dealer_slug: b.dealerSlug ?? "",
    price_min: b.priceMin ?? 0,
    price_max: b.priceMax ?? 0,
    range_km: b.rangeKm ?? 0,
    payload_kg: b.payloadKg ?? null,
    charging_time_fast: b.chargingTimeFast ?? "",
    charging_time_slow: b.chargingTimeSlow ?? "",
    image_url: b.imageUrl ?? "",
    description: b.description ?? "",
    highlights: b.highlights ?? "[]",
    status: b.status ?? "active",
  };
}
