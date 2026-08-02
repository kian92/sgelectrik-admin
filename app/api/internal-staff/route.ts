import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";

async function isSuperadmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "superadmin";
}

export async function GET() {
  if (!(await isSuperadmin()))
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id,name,email,role,status,created_at")
    .in("role", ["superadmin", "editor"])
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!(await isSuperadmin()))
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { name, email, password, role } = await req.json();
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  if (!String(name ?? "").trim() || !normalizedEmail || String(password ?? "").length < 8)
    return NextResponse.json({ error: "Name, valid email, and an 8-character password are required." }, { status: 400 });
  if (role !== "editor" && role !== "superadmin")
    return NextResponse.json({ error: "Invalid internal role." }, { status: 400 });

  const { data: existing } = await supabaseServer.from("dealers").select("id").eq("email", normalizedEmail).maybeSingle();
  if (existing) return NextResponse.json({ error: "Email is already registered." }, { status: 409 });

  const passwordHash = await bcrypt.hash(String(password), 10);
  const slug = `internal-${normalizedEmail.split("@")[0].replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
  const { data, error } = await supabaseServer
    .from("dealers")
    .insert({ name: String(name).trim(), short_name: String(name).trim(), email: normalizedEmail, password: passwordHash, role, status: "active", slug })
    .select("id,name,email,role,status,created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
