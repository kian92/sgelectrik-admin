import { NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabase-server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { error } = await supabaseServer
    .from("newsletters")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete newsletter:", error);
    return NextResponse.json(
      { error: "Failed to delete newsletter" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const {
      subject,
      previewText,
      contentHtml,
      ctaText,
      ctaUrl,
      recipientType,
      selectedUserIds,
      customEmails,
    } = body;

    // Only drafts can be edited
    const { data: existing, error: fetchError } = await supabaseServer
      .from("newsletters")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Newsletter not found" },
        { status: 404 },
      );
    }

    if (existing.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft newsletters can be edited" },
        { status: 400 },
      );
    }

    if (!subject?.trim()) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 },
      );
    }
    if (!contentHtml?.trim()) {
      return NextResponse.json(
        { error: "Newsletter content is required" },
        { status: 400 },
      );
    }

    // Resolve recipients same as create route
    let recipients: { email: string; dealer_id: number | null }[] = [];

    if (recipientType === "all") {
      const { data: dealers, error: dealersError } = await supabaseServer
        .from("dealers")
        .select("id, email")
        .eq("status", "active")
        .not("email", "is", null);

      if (dealersError) {
        return NextResponse.json(
          { error: "Failed to resolve recipients" },
          { status: 500 },
        );
      }
      recipients = (dealers || []).map((d) => ({
        email: d.email,
        dealer_id: d.id,
      }));
    } else if (recipientType === "selected") {
      const ids: number[] = Array.isArray(selectedUserIds)
        ? selectedUserIds
        : [];
      if (ids.length === 0) {
        return NextResponse.json(
          { error: "Select at least one user" },
          { status: 400 },
        );
      }

      const { data: dealers, error: dealersError } = await supabaseServer
        .from("dealers")
        .select("id, email")
        .in("id", ids)
        .not("email", "is", null);

      if (dealersError) {
        return NextResponse.json(
          { error: "Failed to resolve recipients" },
          { status: 500 },
        );
      }
      recipients = (dealers || []).map((d) => ({
        email: d.email,
        dealer_id: d.id,
      }));
    } else {
      const parsed = parseCustomEmails(customEmails || "");
      if (parsed.length === 0) {
        return NextResponse.json(
          { error: "Enter at least one valid email address" },
          { status: 400 },
        );
      }
      recipients = parsed.map((email) => ({ email, dealer_id: null }));
    }

    // Update the newsletter row
    const { data: updated, error: updateError } = await supabaseServer
      .from("newsletters")
      .update({
        subject: subject.trim(),
        preview_text: previewText?.trim() || null,
        content_html: contentHtml,
        cta_text: ctaText?.trim() || null,
        cta_url: ctaUrl?.trim() || null,
        recipient_type: recipientType,
        total_recipients: recipients.length,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update newsletter:", updateError);
      return NextResponse.json(
        { error: "Failed to update newsletter" },
        { status: 500 },
      );
    }

    // Replace recipients wholesale (safe since status is still draft, nothing sent yet)
    await supabaseServer
      .from("newsletter_recipients")
      .delete()
      .eq("newsletter_id", id);

    const { error: recipientsError } = await supabaseServer
      .from("newsletter_recipients")
      .insert(
        recipients.map((r) => ({
          newsletter_id: id,
          email: r.email,
          dealer_id: r.dealer_id,
          status: "pending",
        })),
      );

    if (recipientsError) {
      console.error("Failed to save recipients:", recipientsError);
      return NextResponse.json(
        { error: "Failed to save recipients" },
        { status: 500 },
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Newsletter update error:", err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
