import { supabaseServer } from "@/app/lib/supabase-server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

// Next.js 15: params is a Promise
type Params = { params: Promise<{ id: string }> };

// GET /api/promotions/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("promotions")
    .select("*, dealers(id, name, slug)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH /api/promotions/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const isSuperadmin = session.user.role === "superadmin";

  if (!isSuperadmin) {
    const { data: existing } = await supabaseServer
      .from("promotions")
      .select("dealer_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }
    // A house promotion (null dealer_id) belongs to no dealer, so this also
    // keeps dealers out of SGElectrik's own listings.
    if (
      existing.dealer_id == null ||
      String(existing.dealer_id) !== String(session.user.id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await req.json();

  // Strip fields that should not be updated directly. Only a superadmin may
  // reassign a promotion between a dealer and SGElectrik.
  const { id: _id, created_at: _ca, dealer_id, ...rest } = body;

  const patch = isSuperadmin && "dealer_id" in body ? { ...rest, dealer_id } : rest;

  const { data, error } = await supabaseServer
    .from("promotions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A promotion with this slug already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// DELETE /api/promotions/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  if (session.user.role !== "superadmin") {
    const { data: existing } = await supabaseServer
      .from("promotions")
      .select("dealer_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
    }
    // House promotions (null dealer_id) are SGElectrik's — never a dealer's.
    if (
      existing.dealer_id == null ||
      String(existing.dealer_id) !== String(session.user.id)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await supabaseServer
    .from("promotions")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
