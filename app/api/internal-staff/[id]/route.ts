import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "superadmin")
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;
  if (String(session.user.id) === id)
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
  const { role } = await req.json();
  if (role !== "editor" && role !== "superadmin")
    return NextResponse.json({ error: "Invalid internal role." }, { status: 400 });
  const { data, error } = await supabaseServer.from("dealers").update({ role }).eq("id", id).in("role", ["editor", "superadmin"]).select("id,name,email,role,status,created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
