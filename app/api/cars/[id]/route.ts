// app/api/cars/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── PATCH /api/cars/[id] ─────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await params;
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
    description,
    highlights,
  } = body;

  const { dealerId, dealerSlug } = body as {
    dealerId?: number;
    dealerSlug?: string;
  } & typeof body;

  const { error } = await supabaseServer
    .from("cars")
    .update({
      name,
      brand,
      model,
      car_type: carType,
      condition,
      year: year ?? null,
      mileage: mileage ?? null,
      price_min: priceMin,
      price_max: priceMax,
      range_km: rangeKm,
      charging_time_fast: chargingTimeFast,
      charging_time_slow: chargingTimeSlow,
      rebate_eligible: rebateEligible,
      rebate_amount: rebateEligible ? rebateAmount : null,
      acceleration,
      top_speed: topSpeed,
      seats,
      monthly_estimate: monthlyEstimate,
      image_url: imageUrl,
      description,
      highlights,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Update car:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (dealerId !== undefined) {
    const targetDealerId = Number(dealerId);
    const { data: currentDealers, error: currentDealerError } = await supabaseServer
      .from("dealers")
      .select("id, car_ids")
      .contains("car_ids", JSON.stringify([id]));

    if (currentDealerError) {
      console.error("Lookup current dealer for car update:", currentDealerError.message);
    }

    if (currentDealers?.length) {
      await Promise.all(
        currentDealers.map((dealer) => {
          if (dealer.id === targetDealerId) return Promise.resolve();
          const updated = (dealer.car_ids as string[]).filter((cid) => cid !== id);
          return supabaseServer
            .from("dealers")
            .update({ car_ids: updated })
            .eq("id", dealer.id);
        }),
      );
    }

    const { data: newDealer } = await supabaseServer
      .from("dealers")
      .select("car_ids")
      .eq("id", targetDealerId)
      .maybeSingle();

    const existingIds: string[] = Array.isArray(newDealer?.car_ids)
      ? newDealer.car_ids
      : [];

    if (!existingIds.includes(id)) {
      await supabaseServer
        .from("dealers")
        .update({ car_ids: [...existingIds, id] })
        .eq("id", targetDealerId);
    }
  }

  return NextResponse.json({ success: true });
}

// ─── DELETE /api/cars/[id] ────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id } = await params;

  // Remove the car
  const { error } = await supabaseServer.from("cars").delete().eq("id", id);

  if (error) {
    console.error("Delete car:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also remove the id from any dealer's car_ids array
  const { data: dealers } = await supabaseServer
    .from("dealers")
    .select("id, car_ids")
    .contains("car_ids", JSON.stringify([id]));

  if (dealers?.length) {
    await Promise.all(
      dealers.map((d) => {
        const updated = (d.car_ids as string[]).filter((cid) => cid !== id);
        return supabaseServer
          .from("dealers")
          .update({ car_ids: updated })
          .eq("id", d.id);
      }),
    );
  }

  return NextResponse.json({ success: true });
}
