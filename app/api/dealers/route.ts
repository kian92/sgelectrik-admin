import { supabaseServer } from "@/app/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/dealers — fetch all dealers
export async function GET() {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/dealers — create a new dealer
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    slug,
    name,
    short_name,
    brands,
    car_ids,
    area,
    address,
    phone,
    email,
    website,
    hours,
    established,
    showrooms,
    description,
    highlights,
    certifications,
    status,
  } = body;

  if (!slug || !name || !email || !address) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseServer
    .from("dealers")
    .insert({
      slug,
      name,
      short_name,
      brands,
      car_ids: car_ids ?? [],
      area,
      address,
      phone,
      email,
      website,
      hours,
      established,
      showrooms,
      description,
      highlights,
      certifications,
      status,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
