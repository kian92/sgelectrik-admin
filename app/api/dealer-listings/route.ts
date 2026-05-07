import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import { nanoid } from "nanoid";

async function getDealerByEmail(email: string) {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, slug, name, car_ids")
    .eq("email", email)
    .eq("role", "dealer")
    .maybeSingle();

  if (error) {
    console.error("getDealerByEmail:", error.message);
    return null;
  }

  return data;
}

// GET /api/dealer-listings?dealerSlug=xxx
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dealer = await getDealerByEmail(session.user.email);
  if (!dealer) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  const ids: string[] = dealer.car_ids ?? [];
  if (ids.length === 0) return NextResponse.json([]);

  const { data: cars, error } = await supabaseServer
    .from("cars")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch listings" },
      { status: 500 },
    );
  }

  const listings = (cars ?? []).map((car) => ({
    id: car.id,
    dealerSlug: dealer.slug,
    brand: car.brand,
    model: car.model,
    carType: car.car_type,
    condition: car.condition,
    priceMin: car.price_min,
    priceMax: car.price_max,
    rangeKm: car.range_km,
    seats: car.seats,
    topSpeed: car.top_speed,
    acceleration: car.acceleration,
    chargingTimeFast: car.charging_time_fast,
    chargingTimeSlow: car.charging_time_slow,
    rebateEligible: car.rebate_eligible,
    rebateAmount: car.rebate_amount ?? null,
    highlights: car.highlights,
    description: car.description,
    monthlyEstimate: car.monthly_estimate,
    year: car.year ?? null,
    mileage: car.mileage ?? null,
    imageUrl: car.image_url || null,
    status: car.status ?? "published",
    createdAt: car.created_at,
  }));

  return NextResponse.json(listings);
}

// POST /api/dealer-listings
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dealer = await getDealerByEmail(session.user.email);
  if (!dealer) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    brand,
    model,
    carType,
    condition,
    priceMin,
    priceMax,
    rangeKm,
    seats,
    topSpeed,
    acceleration,
    chargingTimeFast,
    chargingTimeSlow,
    rebateEligible,
    rebateAmount,
    highlights,
    description,
    monthlyEstimate,
    year,
    mileage,
    imageUrl,
  } = body;

  if (!brand || !model || !priceMin || !rangeKm) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const carId = `${brand.toLowerCase().replace(/\s+/g, "-")}-${model.toLowerCase().replace(/\s+/g, "-")}-${nanoid(6)}`;

  // Insert car
  const { data: newCar, error: carError } = await supabaseServer
    .from("cars")
    .insert({
      id: carId,
      name: `${brand} ${model}`,
      brand,
      model,
      car_type: carType,
      condition,
      price_min: priceMin,
      price_max: priceMax ?? priceMin,
      range_km: rangeKm,
      seats: seats ?? 5,
      top_speed: topSpeed ?? 0,
      acceleration: acceleration ?? "",
      charging_time_fast: chargingTimeFast ?? "",
      charging_time_slow: chargingTimeSlow ?? "",
      rebate_eligible: rebateEligible ?? false,
      rebate_amount: rebateAmount ?? null,
      highlights: highlights ?? "[]",
      description: description ?? "",
      monthly_estimate: monthlyEstimate ?? 0,
      year: year ?? null,
      mileage: mileage ?? null,
      image_url: imageUrl ?? "",
    })
    .select()
    .single();

  if (carError) {
    console.error("Car insert error:", carError);
    return NextResponse.json(
      { error: "Failed to create listing" },
      { status: 500 },
    );
  }

  // Append carId to dealer's car_ids
  const updatedCarIds = [...(dealer.car_ids ?? []), carId];
  const { error: dealerUpdateError } = await supabaseServer
    .from("dealers")
    .update({ car_ids: updatedCarIds })
    .eq("id", dealer.id);

  if (dealerUpdateError) {
    console.error("Dealer update error:", dealerUpdateError);
    // Rollback
    await supabaseServer.from("cars").delete().eq("id", carId);
    return NextResponse.json(
      { error: "Failed to update dealer" },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      id: newCar.id,
      brand: newCar.brand,
      model: newCar.model,
      carType: newCar.car_type,
      condition: newCar.condition,
      priceMin: newCar.price_min,
      priceMax: newCar.price_max,
      rangeKm: newCar.range_km,
      imageUrl: newCar.image_url || null,
      status: "published",
      createdAt: newCar.created_at,
    },
    { status: 201 },
  );
}
