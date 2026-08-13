import { supabaseServer } from "@/app/lib/supabase-server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/dealers/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (session.user.role !== "superadmin" && String(session.user.id) !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseServer
    .from("dealers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  const carIds: number[] = data.car_ids ?? [];
  let cars: { id: number; name: string }[] = [];
  if (carIds.length > 0) {
    const { data: carsData } = await supabaseServer
      .from("cars")
      .select("id, name")
      .in("id", carIds);
    cars = carsData ?? [];
  }

  const { data: commercialEvsData } = await supabaseServer
    .from("commercial_evs")
    .select("id, name")
    .eq("dealer_id", id);
  const commercialEvs = commercialEvsData ?? [];

  const { data: rentalCompanyData } = await supabaseServer
    .from("rental_companies")
    .select("id, name, slug")
    .eq("dealer_id", id)
    .maybeSingle();

  return NextResponse.json({
    ...data,
    brands: data.brands ?? [],
    car_ids: carIds,
    cars,
    commercial_evs: commercialEvs,
    rental_company: rentalCompanyData ?? null,
  });
}

// PATCH /api/dealers/[id] — update dealer (admin only)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const { data, error } = await supabaseServer
    .from("dealers")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// DELETE /api/dealers/[id] (admin only)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseServer.from("dealers").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
