import { Resend } from "resend";

const FROM_ADDRESS = "noreply@fusiontools.ai";
const FROM_NAME = "SGElectrik";
const BASE_URL = process.env.APP_BASE_URL ?? "https://sgtravelagents.com";

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(apiKey);
}

export async function sendApprovedEmail(opts: {
  toEmail: string;
  toName: string;
  agentName: string;
}) {
  const resend = getResendClient();
  const loginUrl = `${BASE_URL}/portal/login`;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_ADDRESS}>`,
      to: opts.toEmail,
      subject: `Your listing "${opts.agentName}" has been approved!`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h2 style="color:#1e293b">Great news, ${opts.toName}! 🎉</h2>
          <p style="color:#475569">Your travel agency listing <strong>${opts.agentName}</strong> on SGElectrik.com has been <strong style="color:#16a34a">approved</strong>.</p>
          <p style="color:#475569">You can now log in to your portal to manage your profile, add tours, and track reviews.</p>
          <a href="${loginUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Log in to your Portal
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:32px">SGElectrik.com · Singapore's Travel Agency Directory</p>
        </div>
      `,
    });
    console.info(`[email] Sent approval email to ${opts.toEmail}`);
  } catch (err) {
    console.error(
      `[email] Failed to send approval email to ${opts.toEmail}`,
      err,
    );
  }
}

export async function sendPasswordResetEmail(opts: {
  toEmail: string;
  toName: string;
  resetToken: string;
}) {
  const resend = getResendClient();
  const resetUrl = `${BASE_URL}/reset-password?token=${opts.resetToken}`;
  console.log("Reset URL", resetUrl, opts);

  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_ADDRESS}>`,
      to: opts.toEmail,
      subject: "Reset your SGElectrik password",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h2 style="color:#1e293b">Password reset request</h2>
          <p style="color:#475569">Hi ${opts.toName},</p>
          <p style="color:#475569">We received a request to reset the password for your SGElectrik account. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Reset my password
          </a>
          <p style="color:#64748b;font-size:13px;margin-top:20px">Or copy this link:<br/><a href="${resetUrl}" style="color:#f97316;word-break:break-all">${resetUrl}</a></p>
          <p style="color:#94a3b8;font-size:13px;margin-top:24px">If you didn't request this, you can safely ignore this email — your password won't change.</p>
          <p style="color:#94a3b8;font-size:12px;margin-top:32px">SGElectrik.com · Singapore's Travel Agency Directory</p>
        </div>
      `,
    });
    console.log("RESEND RESPONSE:", result);
    console.info(`[email] Sent password reset email to ${opts.toEmail}`);
  } catch (err) {
    console.error(
      `[email] Failed to send password reset email to ${opts.toEmail}`,
      err,
    );
  }
}

export async function sendInviteEmail(opts: {
  toEmail: string;
  toName: string;
  agentName: string;
  inviteToken: string;
}) {
  const resend = getResendClient();
  const activateUrl = `${BASE_URL}/portal/set-password?token=${opts.inviteToken}`;

  try {
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_ADDRESS}>`,
      to: opts.toEmail,
      subject: `Your listing "${opts.agentName}" is approved — set up your account`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h2 style="color:#1e293b">Welcome to SGElectrik.com, ${opts.toName}! 🎉</h2>
          <p style="color:#475569">Your travel agency listing <strong>${opts.agentName}</strong> has been <strong style="color:#16a34a">approved</strong>.</p>
          <p style="color:#475569">To access your agent portal, click the button below to set up your password. This link expires in <strong>7 days</strong>.</p>
          <a href="${activateUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f97316;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
            Set Up My Account
          </a>
          <p style="color:#64748b;font-size:13px;margin-top:20px">Or copy this link:<br/><a href="${activateUrl}" style="color:#f97316;word-break:break-all">${activateUrl}</a></p>
          <p style="color:#94a3b8;font-size:12px;margin-top:32px">SGElectrik.com · Singapore's Travel Agency Directory</p>
        </div>
      `,
    });
    console.info(`[email] Sent invite email to ${opts.toEmail}`);
  } catch (err) {
    console.error(
      `[email] Failed to send invite email to ${opts.toEmail}`,
      err,
    );
  }
}
