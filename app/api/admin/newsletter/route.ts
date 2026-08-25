import { NextResponse } from "next/server";
import { supabaseServer } from "@/app/lib/supabase-server";
import { processNewsletter } from "@/app/lib/process-newsletter";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("newsletters")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch newsletters:", error);
    return NextResponse.json(
      { error: "Failed to fetch newsletters" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}

type RawRecipient = {
  email: string;
  dealer_id: number | null;
};

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

export async function POST(req: Request) {
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
      createdBy,
      action,
    } = body;

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
    if (!["all", "selected", "custom"].includes(recipientType)) {
      return NextResponse.json(
        { error: "Invalid recipient type" },
        { status: 400 },
      );
    }

    let recipients: RawRecipient[] = [];

    if (recipientType === "all") {
      const { data: dealers, error: dealersError } = await supabaseServer
        .from("dealers")
        .select("id, email")
        .eq("status", "active")
        .not("email", "is", null);

      if (dealersError) {
        console.error("Failed to fetch dealers:", dealersError);
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
        console.error("Failed to fetch selected dealers:", dealersError);
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

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No valid recipients found" },
        { status: 400 },
      );
    }

    const { data: newsletter, error: createError } = await supabaseServer
      .from("newsletters")
      .insert({
        subject: subject.trim(),
        preview_text: previewText?.trim() || null,
        content_html: contentHtml,
        cta_text: ctaText?.trim() || null,
        cta_url: ctaUrl?.trim() || null,
        recipient_type: recipientType,
        created_by: createdBy || null,
        status: action === "send" ? "sending" : "draft",
        total_recipients: recipients.length,
      })
      .select()
      .single();

    if (createError || !newsletter) {
      console.error("Failed to create newsletter:", createError);
      return NextResponse.json(
        { error: "Failed to create newsletter" },
        { status: 500 },
      );
    }

    const { error: recipientsError } = await supabaseServer
      .from("newsletter_recipients")
      .insert(
        recipients.map((r) => ({
          newsletter_id: newsletter.id,
          email: r.email,
          dealer_id: r.dealer_id,
          status: "pending",
        })),
      );

    if (recipientsError) {
      console.error("Failed to insert recipients:", recipientsError);
      return NextResponse.json(
        { error: "Failed to save recipients" },
        { status: 500 },
      );
    }

    if (action !== "send") {
      return NextResponse.json(newsletter, { status: 201 });
    }

    const result = await processNewsletter(newsletter.id);

    const { data: updated } = await supabaseServer
      .from("newsletters")
      .select("*")
      .eq("id", newsletter.id)
      .single();

    return NextResponse.json(updated || newsletter, { status: 201 });
  } catch (error) {
    console.error("Newsletter API error:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
