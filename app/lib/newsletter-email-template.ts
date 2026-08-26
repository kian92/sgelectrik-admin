type EmailTemplateOptions = {
  contentHtml: string;
  ctaText?: string | null;
  ctaUrl?: string | null;
};

const LOGO_URL = "https://sgelectrik.com/icon.png"; // replace with your actual hosted logo URL
const SITE_URL = "https://www.sgelectrik.com";
const SUPPORT_EMAIL = "support@sgelectrik.com";

export function buildNewsletterEmailHtml({
  contentHtml,
  ctaText,
  ctaUrl,
}: EmailTemplateOptions): string {
  const ctaBlock =
    ctaText && ctaUrl
      ? `<tr>
           <td align="center" style="padding: 24px 0 8px;">
             <a href="${ctaUrl}"
                style="background:#4a7c3f;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px;">
               ${ctaText}
             </a>
           </td>
         </tr>`
      : "";

  return `
  <div style="background:#f4f4f5;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;" cellpadding="0" cellspacing="0">

      <!-- Header -->
      <tr>
        <td align="center" style="padding:32px 24px 16px;">
          <img src="${LOGO_URL}" alt="SGElectrik" width="56" height="56" style="display:block;border-radius:50%;" />
        </td>
      </tr>

      <!-- Content -->
      <tr>
        <td style="padding:8px 40px 24px;color:#1e293b;font-size:15px;line-height:1.6;">
          <div class="newsletter-content">
            ${contentHtml}
          </div>
        </td>
      </tr>

      <!-- CTA -->
      ${ctaBlock}

      <!-- Divider -->
      <tr>
        <td style="padding:24px 40px 0;">
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:0;" />
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td align="center" style="padding:24px 40px 32px;color:#64748b;font-size:13px;line-height:1.8;">
          <p style="margin:0;">Need help?</p>
          <p style="margin:0;">
            Email: <a href="mailto:${SUPPORT_EMAIL}" style="color:#2563eb;text-decoration:underline;">${SUPPORT_EMAIL}</a>
          </p>
          <p style="margin:12px 0 0;">
            <a href="${SITE_URL}" style="color:#2563eb;text-decoration:underline;">${SITE_URL}</a>
          </p>
          <div style="margin-top:18px;text-align:center;">

  <a
    href="https://www.facebook.com/profile.php?id=61591463308428"
    target="_blank"
    style="display:inline-block;margin:0 8px;"
  >
    <img
      src="https://www.sgelectrik.com/social/facebook.png"
      width="28"
      height="28"
      alt="Facebook"
      style="display:block;border:0;"
    />
  </a>

  <a
    href="https://www.instagram.com/sgelectrik/"
    target="_blank"
    style="display:inline-block;margin:0 8px;"
  >
    <img
      src="https://www.sgelectrik.com/social/instagram.png"
      width="28"
      height="28"
      alt="Instagram"
      style="display:block;border:0;"
    />
  </a>

  <a
    href="https://www.linkedin.com/in/sgelectrik-com-b346273b8"
    target="_blank"
    style="display:inline-block;margin:0 8px;"
  >
    <img
      src="https://www.sgelectrik.com/social/linkedin.png"
      width="28"
      height="28"
      alt="LinkedIn"
      style="display:block;border:0;"
    />
  </a>

</div>
        </td>
      </tr>

    </table>
  </div>`;
}
