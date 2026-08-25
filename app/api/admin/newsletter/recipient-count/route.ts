import { NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabase-server";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseCustomEmails(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\n,]/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0 && isValidEmail(e)),
    ),
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  const { recipientType, selectedUserIds, customEmails } = body;

  if (recipientType === "all") {
    const { count, error } = await supabaseServer
      .from("dealers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .not("email", "is", null);

    if (error)
      return NextResponse.json({ error: "Failed to count" }, { status: 500 });
    return NextResponse.json({ count: count || 0 });
  }

  if (recipientType === "selected") {
    const ids = Array.isArray(selectedUserIds) ? selectedUserIds : [];
    return NextResponse.json({ count: ids.length });
  }

  if (recipientType === "custom") {
    const parsed = parseCustomEmails(customEmails || "");
    return NextResponse.json({ count: parsed.length });
  }

  return NextResponse.json({ count: 0 });
}
