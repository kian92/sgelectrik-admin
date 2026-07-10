import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";

// PATCH /api/account/password — change own password
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current and new password are required." },
      { status: 400 },
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const { data: dealer, error: fetchError } = await supabaseServer
    .from("dealers")
    .select("id, password")
    .eq("id", session.user.id)
    .single();

  if (fetchError || !dealer?.password) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, dealer.password);
  if (!valid) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const { error: updateError } = await supabaseServer
    .from("dealers")
    .update({ password: hashedPassword, updated_at: new Date().toISOString() })
    .eq("id", session.user.id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update password." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
