import { NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabase-server";

// ─── GET /api/charging-stations/[id] ─────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data, error } = await supabaseServer
    .from("charging_stations")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  }

  return NextResponse.json(toClient(data));
}

// ─── PATCH /api/charging-stations/[id] ───────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Build an update object — only include fields that were actually sent
  const updates: Record<string, any> = {};
  if (body.name != null) updates.name = body.name;
  if (body.network != null) updates.network = body.network;
  if (body.lat != null) updates.lat = body.lat;
  if (body.lng != null) updates.lng = body.lng;
  if (body.address != null) updates.address = body.address;
  if (body.area != null) updates.area = body.area;
  if (body.connectors != null) updates.connectors = body.connectors;
  if (body.connectorTypes != null)
    updates.connector_types = body.connectorTypes;
  if (body.power != null) updates.power = body.power;
  if (body.pricing != null) updates.pricing = body.pricing;
  if (body.hours != null) updates.hours = body.hours;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseServer
    .from("charging_stations")
    .update(updates)
    .eq("id", Number(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(toClient(data));
}

// ─── DELETE /api/charging-stations/[id] ──────────────────────────────────────

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { error } = await supabaseServer
    .from("charging_stations")
    .delete()
    .eq("id", Number(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
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
    connectorTypes: row.connector_types,
    power: row.power,
    pricing: row.pricing,
    hours: row.hours,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
