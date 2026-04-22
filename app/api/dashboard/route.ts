import { supabaseServer } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";

// GET /api/admin/dashboard
export async function GET() {
  const [leadsRes, claimsRes, usersRes] = await Promise.all([
    supabaseServer
      .from("leads")
      .select("id, name, preferred_car, created_at")
      .order("created_at", { ascending: false }),

    supabaseServer.from("dealer_claims").select("status"),

    supabaseServer.from("users").select("id", { count: "exact", head: true }),
  ]);

  if (leadsRes.error)
    return NextResponse.json(
      { error: leadsRes.error.message },
      { status: 500 },
    );
  if (claimsRes.error)
    return NextResponse.json(
      { error: claimsRes.error.message },
      { status: 500 },
    );
  if (usersRes.error)
    return NextResponse.json(
      { error: usersRes.error.message },
      { status: 500 },
    );

  const leads = leadsRes.data ?? [];
  const claims = claimsRes.data ?? [];

  // --- Counts ---
  const totalEnquiries = leads.length;
  const totalUsers = usersRes.count ?? 0;
  const approvedDealers = claims.filter((c) => c.status === "approved").length;
  const pendingClaims = claims.filter((c) => c.status === "pending").length;

  // --- Recent 5 enquiries (already ordered desc) ---
  const recentEnquiries = leads.slice(0, 5).map((l) => ({
    id: l.id,
    name: l.name,
    preferred_car: l.preferred_car,
    created_at: l.created_at,
  }));

  // --- Top 5 models ---
  const carCount: Record<string, number> = {};
  for (const lead of leads) {
    carCount[lead.preferred_car] = (carCount[lead.preferred_car] ?? 0) + 1;
  }
  const topModels = Object.entries(carCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([car, count]) => ({ car, count }));

  return NextResponse.json({
    totalEnquiries,
    totalUsers,
    approvedDealers,
    pendingClaims,
    recentEnquiries,
    topModels,
  });
}
