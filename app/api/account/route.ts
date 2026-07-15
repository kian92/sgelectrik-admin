import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";

// GET /api/account — current user's own profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, name, email, role, phone, whatsapp_number, area")
    .eq("id", session.user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH /api/account — update own name / phone / area (not email or password)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();
  const update: Record<string, string | null> = {};

  if (typeof body.name === "string") {
    if (!body.name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    update.name = body.name.trim();
  }
  if (typeof body.phone === "string") {
    update.phone = body.phone.trim() || null;
  }
  if (typeof body.whatsappNumber === "string") {
    const whatsappNumber = body.whatsappNumber.trim();
    const digits = whatsappNumber.replace(/\D/g, "");
    if (whatsappNumber && (!whatsappNumber.startsWith("+") || digits.length < 8 || digits.length > 15)) {
      return NextResponse.json(
        { error: "WhatsApp number must include a valid country code, for example +65 8123 4567." },
        { status: 400 },
      );
    }
    update.whatsapp_number = whatsappNumber || null;
  }
  if (typeof body.area === "string") {
    update.area = body.area.trim() || null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("dealers")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", session.user.id)
    .select("id, name, email, role, phone, whatsapp_number, area")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to update account." }, { status: 500 });
  }

  return NextResponse.json(data);
}
