import { NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabase-server";
import { processNewsletter } from "@/app/lib/process-newsletter";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data: newsletter, error } = await supabaseServer
    .from("newsletters")
    .select("id, status")
    .eq("id", id)
    .single();

  if (error || !newsletter) {
    return NextResponse.json(
      { error: "Newsletter not found" },
      { status: 404 },
    );
  }

  if (newsletter.status === "sent") {
    return NextResponse.json(
      { error: "This newsletter has already been sent" },
      { status: 400 },
    );
  }

  const { count } = await supabaseServer
    .from("newsletter_recipients")
    .select("*", { count: "exact", head: true })
    .eq("newsletter_id", id)
    .neq("status", "sent");

  if (!count || count === 0) {
    return NextResponse.json(
      { error: "No pending recipients to send to" },
      { status: 400 },
    );
  }

  await supabaseServer
    .from("newsletters")
    .update({ status: "sending" })
    .eq("id", id);

  // Send immediately, in this same request — no cron wait required
  const result = await processNewsletter(id);

  return NextResponse.json({ sent: true, ...result });
}
