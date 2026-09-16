import { supabaseServer } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";

interface BrandRef {
  id: string;
  name: string;
}

interface CommercialEvPriceWithBrand {
  id: string;
  model: string;
  price_from: number;
  updated_at: string;
  brand: BrandRef | BrandRef[] | null;
}

function validateCreate(input: unknown): {
  brand_id: string;
  model: string;
  price_from: number;
} | null {
  if (typeof input !== "object" || input === null) return null;
  const { brandId, model, priceFrom } = input as Record<string, unknown>;

  if (typeof brandId !== "string" || brandId.trim().length === 0) return null;
  if (typeof model !== "string" || model.trim().length === 0) return null;

  const price = typeof priceFrom === "number" ? priceFrom : Number(priceFrom);
  if (!Number.isFinite(price) || price < 0) return null;

  return {
    brand_id: brandId,
    model: model.trim(),
    price_from: Math.round(price),
  };
}

const SELECT_WITH_BRAND =
  "id, model, price_from, updated_at, brand:commercial_ev_brands(id, name)";

function brandName(brand: BrandRef | BrandRef[] | null): string {
  const b = Array.isArray(brand) ? brand[0] : brand;
  return b?.name ?? "";
}

export async function GET() {
  const { data, error } = await supabaseServer
    .from("commercial_ev_prices")
    .select<typeof SELECT_WITH_BRAND, CommercialEvPriceWithBrand>(
      SELECT_WITH_BRAND,
    )
    .order("model", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = [...(data ?? [])].sort((a, b) =>
    brandName(a.brand).localeCompare(brandName(b.brand)),
  );

  return NextResponse.json({ rows });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const row = validateCreate(body);

  if (!row) {
    return NextResponse.json(
      { error: "brandId, model and priceFrom (>= 0) are required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseServer
    .from("commercial_ev_prices")
    .insert(row)
    .select<typeof SELECT_WITH_BRAND, CommercialEvPriceWithBrand>(
      SELECT_WITH_BRAND,
    )
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

  return NextResponse.json({ row: data }, { status: 201 });
}
