import { Resend } from "resend";
import { supabaseServer } from "@/app/lib/supabase-server";
import { buildNewsletterEmailHtml } from "@/app/lib/newsletter-email-template";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@sgelectrik.com";

/**
 * Sends all pending recipients for a single newsletter, immediately.
 * Loops through recipients in chunks to avoid one giant burst of
 * concurrent requests, but does NOT wait for a separate cron trigger —
 * this runs to completion within the calling request.
 */
export async function processNewsletter(newsletterId: string) {
  const { data: newsletter, error } = await supabaseServer
    .from("newsletters")
    .select("*")
    .eq("id", newsletterId)
    .single();

  if (error || !newsletter) {
    throw new Error("Newsletter not found");
  }

  const { data: recipients, error: recipientsError } = await supabaseServer
    .from("newsletter_recipients")
    .select("*")
    .eq("newsletter_id", newsletterId)
    .neq("status", "sent");

  if (recipientsError) {
    throw new Error("Failed to load recipients");
  }

  if (!recipients || recipients.length === 0) {
    return { successCount: 0, failCount: 0 };
  }

  const html = buildNewsletterEmailHtml({
    contentHtml: newsletter.content_html,
    ctaText: newsletter.cta_text,
    ctaUrl: newsletter.cta_url,
  });

  let successCount = 0;
  let failCount = 0;

  for (const r of recipients) {
    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: r.email,
        subject: newsletter.subject,
        html,
        text: newsletter.preview_text || undefined,
      });

      if (result.error) throw new Error(result.error.message);

      await supabaseServer
        .from("newsletter_recipients")
        .update({
          status: "sent",
          resend_id: result.data?.id || null,
          sent_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", r.id);

      successCount++;
    } catch (sendError) {
      console.error(`Failed to send to ${r.email}:`, sendError);

      await supabaseServer
        .from("newsletter_recipients")
        .update({
          status: "failed",
          error_message:
            sendError instanceof Error ? sendError.message : "Unknown error",
        })
        .eq("id", r.id);

      failCount++;
    }
  }

  // Recompute totals across ALL recipients (handles retries mixing
  // previously-sent with newly-sent/failed)
  const { data: all } = await supabaseServer
    .from("newsletter_recipients")
    .select("status")
    .eq("newsletter_id", newsletterId);

  const totalSuccess = all?.filter((r) => r.status === "sent").length || 0;
  const totalFailed = all?.filter((r) => r.status === "failed").length || 0;

  const finalStatus =
    totalFailed === 0
      ? "sent"
      : totalSuccess === 0
        ? "failed"
        : "partially_failed";

  await supabaseServer
    .from("newsletters")
    .update({
      status: finalStatus,
      successful_sends: totalSuccess,
      failed_sends: totalFailed,
      sent_at: new Date().toISOString(),
    })
    .eq("id", newsletterId);

  return { successCount, failCount };
}
