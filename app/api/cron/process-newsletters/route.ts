import { NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabase-server";
import { processNewsletter } from "@/app/lib/process-newsletter";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: queued, error } = await supabaseServer
    .from("newsletters")
    .select("id")
    .eq("status", "sending");

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch queue" },
      { status: 500 },
    );
  }

  if (!queued || queued.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processedTotal = 0;
  for (const n of queued) {
    const result = await processNewsletter(n.id);
    processedTotal += result.successCount + result.failCount;
  }

  return NextResponse.json({ processed: processedTotal });
}
