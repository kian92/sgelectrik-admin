import { supabaseServer } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: "Brand name is required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseServer
    .from("commercial_ev_brands")
    .update({ name })
    .eq("id", id)
    .select("id, name")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `"${name}" already exists.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ brand: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { error } = await supabaseServer
    .from("commercial_ev_brands")
    .delete()
    .eq("id", id);

  if (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        {
          error:
            "This brand still has models under it. Delete or reassign those models first.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
