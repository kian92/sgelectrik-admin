import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildNewsletterEmailHtml } from "@/app/lib/newsletter-email-template";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@sgelectrik.com";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const { testEmail, subject, previewText, contentHtml, ctaText, ctaUrl } =
      await req.json();

    if (!testEmail || !isValidEmail(testEmail)) {
      return NextResponse.json(
        { error: "Enter a valid test email address" },
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
        { error: "Content is required" },
        { status: 400 },
      );
    }

    // ✅ built here, inside the function, where these variables exist
    const html = buildNewsletterEmailHtml({ contentHtml, ctaText, ctaUrl });

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: testEmail,
      subject: `[TEST] ${subject}`,
      html,
      text: previewText || undefined,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (err) {
    console.error("Test send error:", err);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 },
    );
  }
}
