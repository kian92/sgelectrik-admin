import { supabaseServer } from "@/app/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sgelectrik.com";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { status } = await req.json();

  const validStatuses = ["pending", "active", "inactive"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Fetch dealer before updating so we have name + email
  const { data: dealer, error: fetchError } = await supabaseServer
    .from("dealers")
    .select("id, name, email, status")
    .eq("id", id)
    .single();

  if (fetchError || !dealer) {
    return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
  }

  // Update status
  const { error } = await supabaseServer
    .from("dealers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send email only when approving
  if (status === "active" && dealer.email) {
    await resend.emails.send({
      from: `SGElectrik <${process.env.RESEND_FROM_EMAIL}>`,
      to: dealer.email,
      subject: "🎉 Your dealer account has been approved – SGElectrik",
      html: approvedEmailHtml({
        name: dealer.name,
        loginUrl: `${APP_URL}/backoffice-login`,
      }),
    });
  }

  // Send email when rejecting
  if (status === "inactive" && dealer.email) {
    await resend.emails.send({
      from: `SGElectrik <${process.env.RESEND_FROM_EMAIL}>`,
      to: dealer.email,
      subject: "Update on your dealer account – SGElectrik",
      html: rejectedEmailHtml({ name: dealer.name }),
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const { error } = await supabaseServer.from("dealers").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}

// ── Email templates ────────────────────────────────────────────────────────────

function approvedEmailHtml({
  name,
  loginUrl,
}: {
  name: string;
  loginUrl: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:1px;">SGELECTRIK.COM</p>
            <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Backoffice Management Portal</p>
          </td>
        </tr>

        <!-- Icon -->
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:#ecfdf5;border-radius:50%;font-size:28px;">✅</div>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:20px 40px 0;text-align:center;">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a;">Account Approved!</h1>
            <p style="margin:0;font-size:15px;color:#64748b;line-height:1.7;">
              Hi <strong style="color:#0f172a;">${name}</strong>, great news! Your dealer account on
              SGElectrik has been reviewed and <strong style="color:#10b981;">approved</strong>.
              You can now log in to your backoffice dashboard and start managing your listings.
            </p>
          </td>
        </tr>

        <!-- What you can do -->
        <tr>
          <td style="padding:24px 40px 0;">
            <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;">
              <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">What you can do now</p>
              <p style="margin:0 0 8px;font-size:14px;color:#334155;">🚗 &nbsp;Add and manage your EV listings</p>
              <p style="margin:0 0 8px;font-size:14px;color:#334155;">📊 &nbsp;View leads and enquiries</p>
              <p style="margin:0;font-size:14px;color:#334155;">✏️ &nbsp;Update your dealer profile</p>
            </div>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:28px 40px;text-align:center;">
            <a href="${loginUrl}"
              style="display:inline-block;background:#10b981;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
              Log in to Dashboard →
            </a>
            <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
              Or copy this link: <span style="color:#10b981;">${loginUrl}</span>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;font-size:12px;color:#cbd5e1;">
              © ${new Date().getFullYear()} SGElectrik · Singapore's EV Marketplace<br/>
              If you have any questions, reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function rejectedEmailHtml({ name }: { name: string }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:1px;">SGELECTRIK.COM</p>
            <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Backoffice Management Portal</p>
          </td>
        </tr>

        <!-- Icon -->
        <tr>
          <td style="padding:36px 40px 0;text-align:center;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:#fef2f2;border-radius:50%;font-size:28px;">❌</div>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:20px 40px 0;text-align:center;">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a;">Account Not Approved</h1>
            <p style="margin:0;font-size:15px;color:#64748b;line-height:1.7;">
              Hi <strong style="color:#0f172a;">${name}</strong>, thank you for applying to join SGElectrik.
              Unfortunately, your dealer account request was not approved at this time.
            </p>
          </td>
        </tr>

        <!-- Reason box -->
        <tr>
          <td style="padding:24px 40px 0;">
            <div style="background:#fef2f2;border-left:4px solid #f87171;border-radius:8px;padding:16px 20px;">
              <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.6;">
                If you believe this is a mistake or would like more information,
                please contact us at <a href="mailto:support@sgelectrik.com" style="color:#ef4444;">support@sgelectrik.com</a>
                and we'll be happy to assist you.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:32px 40px 24px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#cbd5e1;">
              © ${new Date().getFullYear()} SGElectrik · Singapore's EV Marketplace<br/>
              If you have any questions, reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
