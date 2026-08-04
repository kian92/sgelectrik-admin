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

export async function GET(
  _: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await canManageBlog()))
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await context.params;

  const { data, error } = await supabaseServer
    .from("blog_posts")
    .select("*")
    .eq("slug", id)
    .single();

  if (error || !data)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await canManageBlog()))
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await context.params;
  const body = await req.json();

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
    .update(body)
    .eq("id", Number(id))
    .select()
    .single();

  if (error || !data)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await canManageBlog()))
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await context.params;

  await supabaseServer.from("blog_posts").delete().eq("id", Number(id));

  return new NextResponse(null, { status: 204 });
}
