import { supabaseServer } from "@/app/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");

  let query = supabaseServer
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.status === "published" && !body.published_at) {
    body.published_at = new Date().toISOString();
  }

  const { data, error } = await supabaseServer
    .from("blog_posts")
    .insert(body)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
