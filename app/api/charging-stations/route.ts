import { NextResponse, NextRequest } from "next/server";
import { supabaseServer } from "@/app/lib/supabase-server";

// ─── GET /api/charging-stations ───────────────────────────────────────────────
// Returns all stations ordered by name.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const network = searchParams.get("network");

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseServer
    .from("charging_stations")
    .select("*", { count: "estimated" }); // 👈 IMPORTANT

  // Add network filter if provided
  if (network) {
    query = query.eq("network", network);
  }

  const { data, error, count } = await query.order("name").range(from, to); // 👈 pagination

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stations = (data ?? []).map(toClient);

  return NextResponse.json({
    data: stations,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

// ─── POST /api/charging-stations ─────────────────────────────────────────────
// Creates a new station. Body must include name, network, lat, lng, address, area.

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    name,
    network,
    lat,
    lng,
    address,
    area,
    connectors,
    connectorTypes,
    power,
    pricing,
    hours,
  } = body;

  if (!name || !network || lat == null || lng == null || !address || !area) {
    return NextResponse.json(
      { error: "name, network, lat, lng, address and area are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseServer
    .from("charging_stations")
    .insert({
      name,
      network,
      lat,
      lng,
      address,
      area,
      connectors: connectors ?? 1,
      connector_types: connectorTypes ?? "[]",
      power: power ?? "",
      pricing: pricing ?? "",
      hours: hours ?? "24 hours",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toClient(data), { status: 201 });
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function toClient(row: any) {
  return {
    id: row.id,
    name: row.name,
    network: row.network,
    lat: row.lat,
    lng: row.lng,
    address: row.address,
    area: row.area,
    connectors: row.connectors,
    connectorTypes: row.connector_types, // kept as JSON string; frontend does JSON.parse
    power: row.power,
    pricing: row.pricing,
    hours: row.hours,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
