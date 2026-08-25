import { NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabase-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) return NextResponse.json([]);

  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, name, email, short_name")
    .eq("status", "active")
    .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
    .limit(20);

  if (error) {
    console.error("User search failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  return NextResponse.json(data);
}
