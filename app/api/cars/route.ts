// app/api/cars/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";

async function getNextCarId(): Promise<number> {
  const { data, error } = await supabaseServer
    .from("cars")
    .select("id")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to generate car id: ${error.message}`);
  }

  return (data?.id ?? 0) + 1;
}

// ─── POST /api/cars ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();

  const {
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
    galleryImages,
    description,
    highlights,
    dealerId,
  } = body;

  if (!name || !brand || !model) {
    return NextResponse.json(
      { error: "name, brand and model are required" },
      { status: 400 },
    );
  }

  const gallery =
    Array.isArray(galleryImages) && galleryImages.length > 0
      ? galleryImages
      : null;

  let nextId: number;
  try {
    nextId = await getNextCarId();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate car id";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: newCar, error: carError } = await supabaseServer
    .from("cars")
    .insert({
      id: nextId,
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
      gallery_images: gallery,
      description: description ?? "",
      highlights: highlights ?? "[]",
    })
    .select("id")
    .single();

  if (carError || !newCar) {
    console.error("Insert car:", carError?.message);
    return NextResponse.json(
      { error: carError?.message ?? "Failed to create car" },
      { status: 500 },
    );
  }

  const carId = newCar.id as number;

  if (dealerId) {
    const { data: dealer } = await supabaseServer
      .from("dealers")
      .select("car_ids")
      .eq("id", dealerId)
      .maybeSingle();

    const existing: number[] = Array.isArray(dealer?.car_ids)
      ? dealer.car_ids.map(Number)
      : [];

    if (!existing.includes(carId)) {
      await supabaseServer
        .from("dealers")
        .update({ car_ids: [...existing, carId] })
        .eq("id", dealerId);
    }
  }

  return NextResponse.json({ success: true, id: carId }, { status: 201 });
}
