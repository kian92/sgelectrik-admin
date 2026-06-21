import { supabaseServer } from "@/app/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("coe_history")
    .select("*")
    .order("exercise_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { exercise_date, exercise_label, cat_a, cat_b, cat_c, cat_d, cat_e } = body;

  if (!exercise_date || !exercise_label) {
    return NextResponse.json({ error: "exercise_date and exercise_label are required" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("coe_history")
    .insert({ exercise_date, exercise_label, cat_a, cat_b, cat_c, cat_d, cat_e })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
