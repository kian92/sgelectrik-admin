// app/api/cars/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseCarId(raw: string): string | null {
  return raw?.trim() ? raw.trim() : null;
}

// ─── PATCH /api/cars/[id] ─────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id: rawId } = await params;
  const carId = parseCarId(rawId);
  if (carId === null) {
    return NextResponse.json({ error: "Invalid car id" }, { status: 400 });
  }

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
    featured,
  } = body;

  const { dealerId } = body as {
    dealerId?: number;
    dealerSlug?: string;
  } & typeof body;

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (name !== undefined) updatePayload.name = name;
  if (brand !== undefined) updatePayload.brand = brand;
  if (model !== undefined) updatePayload.model = model;
  if (carType !== undefined) updatePayload.car_type = carType;
  if (condition !== undefined) updatePayload.condition = condition;
  if (year !== undefined) updatePayload.year = year ?? null;
  if (mileage !== undefined) updatePayload.mileage = mileage ?? null;
  if (priceMin !== undefined) updatePayload.price_min = priceMin;
  if (priceMax !== undefined) updatePayload.price_max = priceMax;
  if (rangeKm !== undefined) updatePayload.range_km = rangeKm;
  if (chargingTimeFast !== undefined)
    updatePayload.charging_time_fast = chargingTimeFast;
  if (chargingTimeSlow !== undefined)
    updatePayload.charging_time_slow = chargingTimeSlow;
  if (rebateEligible !== undefined) {
    updatePayload.rebate_eligible = rebateEligible;
    updatePayload.rebate_amount = rebateEligible ? rebateAmount : null;
  }
  if (acceleration !== undefined) updatePayload.acceleration = acceleration;
  if (topSpeed !== undefined) updatePayload.top_speed = topSpeed;
  if (seats !== undefined) updatePayload.seats = seats;
  if (monthlyEstimate !== undefined)
    updatePayload.monthly_estimate = monthlyEstimate;
  if (imageUrl !== undefined) updatePayload.image_url = imageUrl;
  if (galleryImages !== undefined) {
    updatePayload.gallery_images = Array.isArray(galleryImages)
      ? galleryImages
      : [];
  }
  if (description !== undefined) updatePayload.description = description;
  if (highlights !== undefined) updatePayload.highlights = highlights;
  if (featured !== undefined) updatePayload.featured = featured;

  const { error } = await supabaseServer
    .from("cars")
    .update(updatePayload)
    .eq("id", carId);

  if (error) {
    console.error("Update car:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (dealerId !== undefined) {
    const targetDealerId = Number(dealerId);
    const { data: currentDealers, error: currentDealerError } =
      await supabaseServer
        .from("dealers")
        .select("id, car_ids")
        .contains("car_ids", JSON.stringify([carId]));

    if (currentDealerError) {
      console.error(
        "Lookup current dealer for car update:",
        currentDealerError.message,
      );
    }

    if (currentDealers?.length) {
      await Promise.all(
        currentDealers.map((dealer) => {
          if (dealer.id === targetDealerId) return Promise.resolve();
          const updated = (dealer.car_ids as string[]).filter((cid) => cid !== carId);
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

    const existingIds: number[] = Array.isArray(newDealer?.car_ids)
      ? newDealer.car_ids.map(Number)
      : [];

    if (!existingIds.includes(carId)) {
      await supabaseServer
        .from("dealers")
        .update({ car_ids: [...existingIds, carId] })
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

  const { id: rawId } = await params;
  const carId = parseCarId(rawId);
  if (carId === null) {
    return NextResponse.json({ error: "Invalid car id" }, { status: 400 });
  }

  const { error } = await supabaseServer
    .from("cars")
    .update({ status: "inactive", deleted_at: new Date().toISOString() })
    .eq("id", carId);

  if (error) {
    console.error("Soft-delete car:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
