import { supabaseServer } from "@/app/lib/supabase-server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

const EVENT_TYPES = [
  "car_view",
  "car_favorited",
  "whatsapp_click",
  "get_deal_click",
  "dealer_view",
] as const;
const PER_CAR_TYPES = ["car_view", "car_favorited", "whatsapp_click", "get_deal_click"] as const;
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

  // Per-car breakdown: raw rows for this dealer's per-car event types,
  // aggregated in-memory (Supabase JS client has no group-by).
  const { data: rows, error: rowsError } = await supabaseServer
    .from("dealer_events")
    .select("car_id, type")
    .eq("dealer_id", id)
    .not("car_id", "is", null)
    .in("type", PER_CAR_TYPES)
    .gte("occurred_at", since);

  if (rowsError) throw new Error(rowsError.message);

  const byCar = new Map<
    number,
    { car_view: number; car_favorited: number; whatsapp_click: number; get_deal_click: number }
  >();
  for (const row of rows ?? []) {
    const carId = row.car_id as number;
    if (!byCar.has(carId)) {
      byCar.set(carId, { car_view: 0, car_favorited: 0, whatsapp_click: 0, get_deal_click: 0 });
    }
    byCar.get(carId)![row.type as (typeof PER_CAR_TYPES)[number]] += 1;
  }

  const carIds = [...byCar.keys()];
  const carNames = new Map<number, string>();
  if (carIds.length > 0) {
    const [carsRes, evsRes] = await Promise.all([
      supabaseServer.from("cars").select("id, name").in("id", carIds),
      supabaseServer.from("commercial_evs").select("id, name").in("id", carIds),
    ]);
    for (const c of carsRes.data ?? []) carNames.set(c.id, c.name);
    for (const c of evsRes.data ?? []) carNames.set(c.id, c.name);
  }

  const perCar = carIds
    .map((carId) => ({
      carId,
      carName: carNames.get(carId) ?? `Car #${carId}`,
      ...byCar.get(carId)!,
    }))
    .sort((a, b) => b.car_view - a.car_view);

  return NextResponse.json({
    windowDays: WINDOW_DAYS,
    ...Object.fromEntries(counts),
    perCar,
  });
}
