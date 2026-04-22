import { supabaseServer } from "@/app/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

// GET /api/dealers/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { data, error } = await supabaseServer
    .from("dealers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH /api/dealers/[id] — update dealer
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
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

// DELETE /api/dealers/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { error } = await supabaseServer.from("dealers").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
