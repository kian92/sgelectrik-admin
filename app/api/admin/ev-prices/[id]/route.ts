import { supabaseServer } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";

type UpdatePayload = {
  brandId?: string;
  model?: string;
  priceFrom?: number;
};

const SELECT_WITH_BRAND =
  "id, model, price_from, updated_at, brand:brands(id, name)";

function buildUpdate(input: unknown) {
  if (typeof input !== "object" || input === null) return null;
  const { brandId, model, priceFrom } = input as UpdatePayload;

  const update: Record<string, string | number> = {};

  if (brandId !== undefined) {
    if (typeof brandId !== "string" || brandId.trim().length === 0) return null;
    update.brand_id = brandId;
  }

  if (model !== undefined) {
    if (typeof model !== "string" || model.trim().length === 0) return null;
    update.model = model.trim();
  }

  if (priceFrom !== undefined) {
    const price = typeof priceFrom === "number" ? priceFrom : Number(priceFrom);
    if (!Number.isFinite(price) || price < 0) return null;
    update.price_from = Math.round(price);
  }

  if (Object.keys(update).length === 0) return null;

  return update;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const update = buildUpdate(body);

  if (!update) {
    return NextResponse.json(
      { error: "Provide at least one of brandId, model, priceFrom to update." },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseServer
    .from("ev_prices")
    .update(update)
    .eq("id", id)
    .select(SELECT_WITH_BRAND)
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This brand already has a model with that name." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ row: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { error } = await supabaseServer
    .from("ev_prices")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
