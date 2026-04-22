import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseServer } from "@/app/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { name, email, password, role } = await req.json();

  // ── Validate ──────────────────────────────────────────────
  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email and password are required." },
      { status: 400 },
    );
  }

  if (!["admin", "dealer"].includes(role)) {
    return NextResponse.json(
      { error: "Role must be admin or dealer." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  // ── Check duplicate email ─────────────────────────────────
  const { data: existing } = await supabaseServer
    .from("dealers")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "This email is already registered." },
      { status: 409 },
    );
  }

  // ── Hash + insert ─────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate a slug from name
  const slug =
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") +
    "-" +
    Date.now();

  const { data: newDealer, error } = await supabaseServer
    .from("dealers")
    .insert({
      slug,
      name,
      short_name: name,
      email,
      password: hashedPassword,
      role,
      status: "active",
    })
    .select("id, name, email, role, created_at")
    .single();

  if (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account." },
      { status: 500 },
    );
  }

  return NextResponse.json({ user: newDealer }, { status: 201 });
}
