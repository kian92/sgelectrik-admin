import { supabaseServer } from "@/app/lib/supabase-server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// "car_favorited" is counted from the favorites table directly (see below),
// not from dealer_events — that event only fires client-side, conditionally
// (production only, requires a resolved dealer_id, dedup window, 30-day
// event-log window), so it silently undercounts real favorites. The
// favorites table is the source of truth and has no such gaps.
const EVENT_TYPES = [
  "car_view",
  "whatsapp_click",
  "get_deal_click",
  "dealer_view",
] as const;
const PER_CAR_TYPES = ["car_view", "whatsapp_click", "get_deal_click"] as const;
const RENTAL_TYPES = [
  "rental_profile_view",
  "rental_view",
  "rental_enquiry_open",
  "rental_whatsapp_click",
] as const;
const PER_RENTAL_TYPES = [
  "rental_view",
  "rental_enquiry_open",
  "rental_whatsapp_click",
] as const;
const WINDOW_DAYS = 30;

// GET /api/dealers/[id]/analytics
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (session.user.role !== "superadmin" && String(session.user.id) !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const since = new Date(Date.now() - WINDOW_DAYS * 86400_000).toISOString();

  const counts = await Promise.all(
    EVENT_TYPES.map(async (type) => {
      const { count, error } = await supabaseServer
        .from("dealer_events")
        .select("*", { count: "exact", head: true })
        .eq("dealer_id", id)
        .eq("type", type)
        .gte("occurred_at", since);

      if (error) throw new Error(error.message);
      return [type, count ?? 0] as const;
    }),
  );

  const rentalCounts = await Promise.all(
    RENTAL_TYPES.map(async (type) => {
      const { count, error } = await supabaseServer
        .from("dealer_events")
        .select("*", { count: "exact", head: true })
        .eq("dealer_id", id)
        .eq("vehicle_type", "rental")
        .eq("type", type)
        .gte("occurred_at", since);

      if (error) throw new Error(error.message);
      return [type, count ?? 0] as const;
    }),
  );

  // This dealer's own inventory, split by vehicle type — favorites for
  // passenger cars and commercial EVs live in the same table but their ids
  // can collide across the two source tables, so each is queried separately
  // with an explicit vehicle_type filter.
  const { data: dealerRow, error: dealerError } = await supabaseServer
    .from("dealers")
    .select("car_ids")
    .eq("id", id)
    .single();
  if (dealerError) throw new Error(dealerError.message);
  const passengerCarIds: string[] = (dealerRow?.car_ids ?? []).map(String);

  const { data: commercialEvRows, error: commercialEvsError } = await supabaseServer
    .from("commercial_evs")
    .select("id")
    .eq("dealer_id", id);
  if (commercialEvsError) throw new Error(commercialEvsError.message);
  const commercialEvIds: string[] = (commercialEvRows ?? []).map((r) => String(r.id));

  const [passengerFavRes, commercialFavRes] = await Promise.all([
    passengerCarIds.length > 0
      ? supabaseServer
          .from("favorites")
          .select("car_id")
          .in("car_id", passengerCarIds)
          .eq("vehicle_type", "passenger")
      : Promise.resolve({ data: [] as { car_id: string }[], error: null }),
    commercialEvIds.length > 0
      ? supabaseServer
          .from("favorites")
          .select("car_id")
          .in("car_id", commercialEvIds)
          .eq("vehicle_type", "commercial")
      : Promise.resolve({ data: [] as { car_id: string }[], error: null }),
  ]);
  if (passengerFavRes.error) throw new Error(passengerFavRes.error.message);
  if (commercialFavRes.error) throw new Error(commercialFavRes.error.message);

  const favoritesByCarId = new Map<string, number>();
  for (const row of passengerFavRes.data ?? []) {
    favoritesByCarId.set(row.car_id, (favoritesByCarId.get(row.car_id) ?? 0) + 1);
  }
  for (const row of commercialFavRes.data ?? []) {
    favoritesByCarId.set(row.car_id, (favoritesByCarId.get(row.car_id) ?? 0) + 1);
  }

  const carFavorited = [...favoritesByCarId.values()].reduce((a, b) => a + b, 0);

  // Per-car breakdown: raw rows for this dealer's per-car event types,
  // aggregated in-memory (Supabase JS client has no group-by).
  const { data: rows, error: rowsError } = await supabaseServer
    .from("dealer_events")
    .select("car_id, type")
    .eq("dealer_id", id)
    .in("vehicle_type", ["passenger", "commercial"])
    .not("car_id", "is", null)
    .in("type", PER_CAR_TYPES)
    .gte("occurred_at", since);

  if (rowsError) throw new Error(rowsError.message);

  const byCar = new Map<
    string,
    { car_view: number; car_favorited: number; whatsapp_click: number; get_deal_click: number }
  >();
  const ensureCar = (carId: string) => {
    if (!byCar.has(carId)) {
      byCar.set(carId, { car_view: 0, car_favorited: 0, whatsapp_click: 0, get_deal_click: 0 });
    }
    return byCar.get(carId)!;
  };
  for (const row of rows ?? []) {
    const carId = String(row.car_id);
    ensureCar(carId)[row.type as (typeof PER_CAR_TYPES)[number]] += 1;
  }
  for (const [carId, favCount] of favoritesByCarId) {
    ensureCar(carId).car_favorited = favCount;
  }

  const carIds = [...byCar.keys()];
  const carNames = new Map<string, string>();
  if (carIds.length > 0) {
    const [carsRes, evsRes] = await Promise.all([
      supabaseServer.from("cars").select("id, name").in("id", carIds),
      supabaseServer.from("commercial_evs").select("id, name").in("id", carIds),
    ]);
    for (const c of carsRes.data ?? []) carNames.set(String(c.id), c.name);
    for (const c of evsRes.data ?? []) carNames.set(String(c.id), c.name);
  }

  const perCar = carIds
    .map((carId) => ({
      carId,
      carName: carNames.get(carId) ?? `Car #${carId}`,
      ...byCar.get(carId)!,
    }))
    .sort((a, b) => b.car_view - a.car_view);

  const { data: rentalRows, error: rentalRowsError } = await supabaseServer
    .from("dealer_events")
    .select("car_id, type")
    .eq("dealer_id", id)
    .eq("vehicle_type", "rental")
    .not("car_id", "is", null)
    .in("type", PER_RENTAL_TYPES)
    .gte("occurred_at", since);

  if (rentalRowsError) throw new Error(rentalRowsError.message);

  const byRental = new Map<
    string,
    {
      rental_view: number;
      rental_enquiry_open: number;
      rental_whatsapp_click: number;
    }
  >();
  for (const row of rentalRows ?? []) {
    const carId = String(row.car_id);
    const values = byRental.get(carId) ?? {
      rental_view: 0,
      rental_enquiry_open: 0,
      rental_whatsapp_click: 0,
    };
    values[row.type as (typeof PER_RENTAL_TYPES)[number]] += 1;
    byRental.set(carId, values);
  }

  const rentalIds = [...byRental.keys()];
  const rentalNames = new Map<string, string>();
  if (rentalIds.length > 0) {
    const { data: rentalCars, error: rentalCarsError } = await supabaseServer
      .from("rental_company_fleet")
      .select("id, model")
      .in("id", rentalIds);
    if (rentalCarsError) throw new Error(rentalCarsError.message);
    for (const car of rentalCars ?? []) {
      rentalNames.set(String(car.id), car.model);
    }
  }

  const perRental = rentalIds
    .map((carId) => ({
      carId,
      carName: rentalNames.get(carId) ?? `Rental #${carId}`,
      ...byRental.get(carId)!,
    }))
    .sort((a, b) => b.rental_view - a.rental_view);

  return NextResponse.json({
    windowDays: WINDOW_DAYS,
    ...Object.fromEntries(counts),
    ...Object.fromEntries(rentalCounts),
    car_favorited: carFavorited,
    perCar,
    perRental,
  });
}
