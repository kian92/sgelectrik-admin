import { supabaseServer } from "@/app/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/dealer-claims — fetch all claims
export async function GET() {
  const { data, error } = await supabaseServer
    .from("dealer_claims")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/dealer-claims — create a new claim
export async function POST(req: NextRequest) {
  const body = await req.json();

  const { company_name, contact_name, email, phone, brands, website, message } =
    body;

  if (!company_name || !contact_name || !email || !phone || !brands) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseServer
    .from("dealer_claims")
    .insert({
      company_name,
      contact_name,
      email,
      phone,
      brands,
      website,
      message,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
