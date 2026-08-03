import { supabaseServer } from "@/app/lib/supabase-server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";

// A dealer may create at most this many promotions in a rolling window, and
// have at most this many active/upcoming (end_date in the future) at once.
// Keeps the public promotions page from being flooded by one dealer; revisit
// if/when a paid tier or credits system replaces this flat allowance.
const CREATION_LIMIT = 3;
const CREATION_WINDOW_DAYS = 7;
const ACTIVE_SLOT_LIMIT = 3;

// GET /api/promotions?dealerId=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dealerId = searchParams.get("dealerId");

  let query = supabaseServer
    .from("promotions")
    .select("*, dealers(id, name, slug)")
    .order("created_at", { ascending: false });

  if (dealerId) {
    query = query.eq("dealer_id", Number(dealerId));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/promotions
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json();

  const {
    dealer_id,
    title,
    slug,
    venue,
    area,
    start_date,
    end_date,
    time_range,
    perks = [],
    image,
    description,
    status = "active",
  } = body;

  if (!dealer_id || !title || !slug || !start_date || !end_date) {
    return NextResponse.json(
      {
        error:
          "dealer_id, title, slug, start_date, and end_date are required",
      },
      { status: 400 },
    );
  }

  if (
    session.user.role !== "superadmin" &&
    String(session.user.id) !== String(dealer_id)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.user.role !== "superadmin") {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - CREATION_WINDOW_DAYS);
    const today = new Date().toISOString().slice(0, 10);

    const [recentRes, activeRes] = await Promise.all([
      supabaseServer
        .from("promotions")
        .select("*", { count: "exact", head: true })
        .eq("dealer_id", dealer_id)
        .gte("created_at", windowStart.toISOString()),
      supabaseServer
        .from("promotions")
        .select("*", { count: "exact", head: true })
        .eq("dealer_id", dealer_id)
        .eq("status", "active")
        .gte("end_date", today),
    ]);

    if ((recentRes.count ?? 0) >= CREATION_LIMIT) {
      return NextResponse.json(
        {
          error: `You've reached the limit of ${CREATION_LIMIT} new promotions every ${CREATION_WINDOW_DAYS} days. Please try again later.`,
        },
        { status: 429 },
      );
    }

    if ((activeRes.count ?? 0) >= ACTIVE_SLOT_LIMIT) {
      return NextResponse.json(
        {
          error: `You already have ${ACTIVE_SLOT_LIMIT} active or upcoming promotions. End or delete one before adding another.`,
        },
        { status: 429 },
      );
    }
  }

  const { data, error } = await supabaseServer
    .from("promotions")
    .insert({
      dealer_id,
      title,
      slug,
      venue,
      area,
      start_date,
      end_date,
      time_range,
      perks,
      image,
      description,
      status,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A promotion with this slug already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
