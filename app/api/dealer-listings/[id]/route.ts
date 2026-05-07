import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";

async function getDealerByEmail(email: string) {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, slug, car_ids")
    .eq("email", email)
    .eq("role", "dealer")
    .maybeSingle();

  if (error) {
    console.error("getDealerByEmail:", error.message);
    return null;
  }

  return data;
}

// PATCH /api/dealer-listings/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dealer = await getDealerByEmail(session.user.email);
  if (!dealer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const carIds: string[] = dealer.car_ids ?? [];
  if (!carIds.includes(id)) {
    return NextResponse.json(
      { error: "Forbidden: car does not belong to your dealership" },
      { status: 403 },
    );
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

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (brand !== undefined) patch.brand = brand;
  if (model !== undefined) patch.model = model;
  if (brand !== undefined && model !== undefined)
    patch.name = `${brand} ${model}`;
  if (carType !== undefined) patch.car_type = carType;
  if (condition !== undefined) patch.condition = condition;
  if (priceMin !== undefined) patch.price_min = priceMin;
  if (priceMax !== undefined) patch.price_max = priceMax;
  if (rangeKm !== undefined) patch.range_km = rangeKm;
  if (seats !== undefined) patch.seats = seats;
  if (topSpeed !== undefined) patch.top_speed = topSpeed;
  if (acceleration !== undefined) patch.acceleration = acceleration;
  if (chargingTimeFast !== undefined)
    patch.charging_time_fast = chargingTimeFast;
  if (chargingTimeSlow !== undefined)
    patch.charging_time_slow = chargingTimeSlow;
  if (rebateEligible !== undefined) patch.rebate_eligible = rebateEligible;
  if (rebateAmount !== undefined) patch.rebate_amount = rebateAmount;
  if (highlights !== undefined) patch.highlights = highlights;
  if (description !== undefined) patch.description = description;
  if (monthlyEstimate !== undefined) patch.monthly_estimate = monthlyEstimate;
  if (year !== undefined) patch.year = year;
  if (mileage !== undefined) patch.mileage = mileage;
  if (imageUrl !== undefined) patch.image_url = imageUrl ?? "";

  const { data: updated, error } = await supabaseServer
    .from("cars")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id: updated.id,
    brand: updated.brand,
    model: updated.model,
    carType: updated.car_type,
    condition: updated.condition,
    priceMin: updated.price_min,
    priceMax: updated.price_max,
    rangeKm: updated.range_km,
    imageUrl: updated.image_url || null,
    updatedAt: updated.updated_at,
  });
}

// DELETE /api/dealer-listings/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dealer = await getDealerByEmail(session.user.email);
  if (!dealer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const carIds: string[] = dealer.car_ids ?? [];
  if (!carIds.includes(id)) {
    return NextResponse.json(
      { error: "Forbidden: car does not belong to your dealership" },
      { status: 403 },
    );
  }

  // Delete the car
  const { error: carDeleteError } = await supabaseServer
    .from("cars")
    .delete()
    .eq("id", id);

  if (carDeleteError) {
    console.error("Car delete error:", carDeleteError);
    return NextResponse.json(
      { error: "Failed to delete listing" },
      { status: 500 },
    );
  }

  // Remove from dealer's car_ids
  const updatedCarIds = carIds.filter((cid) => cid !== id);
  const { error: dealerUpdateError } = await supabaseServer
    .from("dealers")
    .update({ car_ids: updatedCarIds })
    .eq("id", dealer.id);

  if (dealerUpdateError) {
    console.error("Dealer car_ids update error:", dealerUpdateError);
    // Car is deleted; log but don't fail
  }

  return NextResponse.json({ success: true, deletedId: id });
}
