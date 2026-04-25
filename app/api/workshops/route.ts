import { supabaseServer } from "@/app/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/workshops?dealerId=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dealerId = searchParams.get("dealerId");

  let query = supabaseServer
    .from("workshops")
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

// POST /api/workshops
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    dealer_id,
    name,
    slug,
    type = "Independent",
    area,
    address,
    phone,
    hours,
    description,
    since,
    services = [],
    brands = [],
    certifications = [],
    rating = 0.0,
    review_count = 0,
    status = "active",
  } = body;

  console.log("BB", body);

  if (!dealer_id || !name || !slug || !type) {
    return NextResponse.json(
      { error: "dealer_id, name, slug, and type are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseServer
    .from("workshops")
    .insert({
      dealer_id,
      name,
      slug,
      type,
      area,
      address,
      phone,
      hours,
      description,
      since,
      services,
      brands,
      certifications,
      rating,
      review_count,
      status,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A workshop with this slug already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
