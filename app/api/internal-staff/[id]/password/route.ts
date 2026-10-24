import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";

// PATCH /api/internal-staff/[id]/password — superadmin sets a new temporary password for a staff member
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "superadmin")
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { id } = await params;
  if (String(session.user.id) === id)
    return NextResponse.json({ error: "Change your own password from Account Settings." }, { status: 400 });

  const { newPassword } = await req.json();
  if (typeof newPassword !== "string" || newPassword.length < 8)
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const { data, error } = await supabaseServer
    .from("dealers")
    .update({ password: passwordHash, updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("role", ["editor", "superadmin"])
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
