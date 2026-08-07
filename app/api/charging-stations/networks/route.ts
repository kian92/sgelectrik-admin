import { NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabase-server";

// ─── GET /api/charging-stations/networks ─────────────────────────────────────
// Returns the distinct list of networks present in the data, sorted A→Z.
// Supabase caps rows at ~1000 per request, so we page through and dedupe.

export async function GET() {
  const set = new Set<string>();
  const pageSize = 1000;
  let from = 0;

  for (;;) {
    const { data, error } = await supabaseServer
      .from("charging_stations")
      .select("network")
      .order("network")
      .range(from, from + pageSize - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      if (row.network) set.add(row.network);
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return NextResponse.json({ networks: [...set].sort() });
}
