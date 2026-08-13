import { supabaseServer } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";

// Sparse map — only include keys present in body
function toRow(b: Record<string, unknown>) {
  return {
    ...(b.question !== undefined && { question: b.question }),
    ...(b.answer !== undefined && { answer: b.answer }),
    ...(b.sortOrder !== undefined && { sort_order: b.sortOrder }),
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
    .eq("id", id)
    .maybeSingle();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabaseServer
    .from("rental_company_faqs")
    .update(toRow(body))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("PATCH rental-company faqs:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { error } = await supabaseServer
    .from("rental_company_faqs")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
