import { supabaseServer } from "@/app/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function canManageBlog() {
  const session = await getServerSession(authOptions);
  return (
    session?.user?.role === "superadmin" || session?.user?.role === "editor"
  );
}

export async function GET(req: NextRequest) {
  if (!(await canManageBlog()))
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
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
  if (!(await canManageBlog()))
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await req.json();

  // Ensure content is always an array, never double-stringified
  if (typeof body.content === "string") {
    const trimmed = body.content.trim();
    if (!trimmed.startsWith("<")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) body.content = parsed;
      } catch {}
    }
  }

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
