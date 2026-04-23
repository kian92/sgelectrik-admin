// app/api/coe-prices/route.ts
import { supabaseServer } from "@/app/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("coe_prices")
    .select("*")
    .order("cat");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
