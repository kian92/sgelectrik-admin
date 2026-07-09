import { supabaseServer } from "@/app/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/promotions?dealerId=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dealerId = searchParams.get("dealerId");

  let query = supabaseServer
    .from("promotions")
    .select("*, dealers(id, name, slug)")
    .order("created_at", { ascending: false });

  if (dealerId) {
    query = query.eq("dealer_id", Number(dealerId));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/promotions
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    dealer_id,
    title,
    slug,
    venue,
    area,
    start_date,
    end_date,
    time_range,
    perks = [],
    image,
    description,
    status = "active",
  } = body;

  if (!dealer_id || !title || !slug || !start_date || !end_date) {
    return NextResponse.json(
      {
        error:
          "dealer_id, title, slug, start_date, and end_date are required",
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseServer
    .from("promotions")
    .insert({
      dealer_id,
      title,
      slug,
      venue,
      area,
      start_date,
      end_date,
      time_range,
      perks,
      image,
      description,
      status,
    })
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

  return NextResponse.json(data, { status: 201 });
}
