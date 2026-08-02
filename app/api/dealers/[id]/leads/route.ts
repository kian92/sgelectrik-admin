import { supabaseServer } from "@/app/lib/supabase-server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/dealers/[id]/leads — leads assigned to this dealer, most recent first
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (session.user.role !== "superadmin" && String(session.user.id) !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = Number(req.nextUrl.searchParams.get("limit")) || 50;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [recentRes, monthCountRes] = await Promise.all([
    supabaseServer
      .from("leads")
      .select("id, name, preferred_car, created_at")
      .eq("dealer_id", id)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabaseServer
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("dealer_id", id)
      .gte("created_at", monthStart.toISOString()),
  ]);

  if (recentRes.error) {
    return NextResponse.json({ error: recentRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    leads: recentRes.data ?? [],
    countThisMonth: monthCountRes.count ?? 0,
  });
}
