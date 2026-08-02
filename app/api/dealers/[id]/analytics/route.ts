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
const WINDOW_DAYS = 30;

// GET /api/dealers/[id]/analytics
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (session.user.role !== "admin" && String(session.user.id) !== id) {
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

  return NextResponse.json({
    windowDays: WINDOW_DAYS,
    ...Object.fromEntries(counts),
  });
}
