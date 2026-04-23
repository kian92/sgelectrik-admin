// app/api/coe-prices/[id]/route.ts
import { supabaseServer } from "@/app/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json();

  // Coerce price to integer if present
  if (body.price !== undefined) {
    body.price = parseInt(body.price);
    if (isNaN(body.price) || body.price < 0) {
      return NextResponse.json(
        { error: "Price must be a valid number" },
        { status: 400 },
      );
    }
  }

  const { data, error } = await supabaseServer
    .from("coe_prices")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === "PGRST116" ? 404 : 500 },
    );
  }

  return NextResponse.json(data);
}
