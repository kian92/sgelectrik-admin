import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/dealers/[id]/password — admin resets a dealer's password
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { id } = await params;
  const { newPassword } = await req.json();

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const { data: dealer, error: fetchError } = await supabaseServer
    .from("dealers")
    .select("id, role")
    .eq("id", id)
    .single();

  if (fetchError || !dealer) {
    return NextResponse.json({ error: "Dealer not found." }, { status: 404 });
  }

  if (dealer.role !== "dealer") {
    return NextResponse.json(
      { error: "Only dealer passwords can be updated here." },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const { error: updateError } = await supabaseServer
    .from("dealers")
    .update({ password: hashedPassword, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update password." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
