// app/api/cars/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";

// ─── POST /api/cars ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();

  const {
    id,
    name,
    brand,
    model,
    carType,
    condition,
    year,
    mileage,
    priceMin,
    priceMax,
    rangeKm,
    chargingTimeFast,
    chargingTimeSlow,
    rebateEligible,
    rebateAmount,
    acceleration,
    topSpeed,
    seats,
    monthlyEstimate,
    imageUrl,
    description,
    highlights,
    dealerId,
    dealerSlug,
  } = body;

  if (!id || !name || !brand || !model) {
    return NextResponse.json(
      { error: "id, name, brand and model are required" },
      { status: 400 },
    );
  }

  // Insert the car
  const { error: carError } = await supabaseServer.from("cars").insert({
    id,
    name,
    brand,
    model,
    car_type: carType ?? "Sedan",
    condition: condition ?? "new",
    year: year ?? null,
    mileage: mileage ?? null,
    price_min: priceMin ?? 0,
    price_max: priceMax ?? 0,
    range_km: rangeKm ?? 0,
    charging_time_fast: chargingTimeFast ?? "",
    charging_time_slow: chargingTimeSlow ?? "",
    rebate_eligible: rebateEligible ?? false,
    rebate_amount: rebateEligible ? (rebateAmount ?? null) : null,
    acceleration: acceleration ?? "",
    top_speed: topSpeed ?? 0,
    seats: seats ?? 5,
    monthly_estimate: monthlyEstimate ?? 0,
    image_url: imageUrl ?? "",
    description: description ?? "",
    highlights: highlights ?? "[]",
  });

  if (carError) {
    console.error("Insert car:", carError.message);
    return NextResponse.json({ error: carError.message }, { status: 500 });
  }

  // Append car id to dealer's car_ids array
  if (dealerId) {
    const { data: dealer } = await supabaseServer
      .from("dealers")
      .select("car_ids")
      .eq("id", dealerId)
      .maybeSingle();

    const existing: string[] = Array.isArray(dealer?.car_ids)
      ? dealer.car_ids
      : [];

    await supabaseServer
      .from("dealers")
      .update({ car_ids: [...existing, id] })
      .eq("id", dealerId);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
