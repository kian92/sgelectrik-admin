import { supabaseServer } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";

function toRow(b: Record<string, unknown>, fleetCarId: number) {
  return {
    fleet_car_id: fleetCarId,
    question: b.question,
    answer: b.answer,
    sort_order: b.sortOrder ?? 0,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data, error } = await supabaseServer
    .from("rental_company_faqs")
    .select("*")
    .eq("fleet_car_id", id)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  if (!body.question || !String(body.question).trim()) {
    return NextResponse.json(
      { error: "Question is required" },
      { status: 400 },
    );
  }
  if (!body.answer || !String(body.answer).trim()) {
    return NextResponse.json({ error: "Answer is required" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("rental_company_faqs")
    .insert(toRow(body, Number(id)))
    .select()
    .single();

  if (error) {
    console.error("POST fleet-car faqs:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
