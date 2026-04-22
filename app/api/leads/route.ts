import { supabaseServer } from "@/app/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/leads — fetch all leads
export async function GET() {
  const { data, error } = await supabaseServer
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/leads — create a new lead
export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    name,
    phone,
    email,
    preferred_car,
    quiz_answers,
    recommendation_result,
  } = body;

  if (!name || !phone || !email || !preferred_car) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseServer
    .from("leads")
    .insert({
      name,
      phone,
      email,
      preferred_car,
      quiz_answers,
      recommendation_result,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
