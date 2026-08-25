"use client";

import { buildNewsletterEmailHtml } from "@/app/lib/newsletter-email-template";

type Props = {
  open: boolean;
  onClose: () => void;
  subject: string;
  previewText: string;
  contentHtml: string;
  ctaText: string;
  ctaUrl: string;
};

export default function PreviewModal({
  open,
  onClose,
  subject,
  previewText,
  contentHtml,
  ctaText,
  ctaUrl,
}: Props) {
  if (!open) return null;

  const emailHtml = buildNewsletterEmailHtml({ contentHtml, ctaText, ctaUrl });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <style>{`
        .newsletter-content h1 { font-size: 1.75rem !important; font-weight: 700 !important; line-height: 1.25; margin: 0.75rem 0; }
        .newsletter-content h2 { font-size: 1.4rem !important; font-weight: 650 !important; line-height: 1.3; margin: 0.75rem 0; }
        .newsletter-content h3 { font-size: 1.15rem !important; font-weight: 650 !important; line-height: 1.35; margin: 0.75rem 0; }
        .newsletter-content p { margin: 0.5rem 0; }
        .newsletter-content ul { list-style-type: disc !important; list-style-position: outside !important; padding-left: 1.5rem !important; margin: 0.5rem 0 0.85rem !important; }
        .newsletter-content ol { list-style-type: decimal !important; list-style-position: outside !important; padding-left: 1.5rem !important; margin: 0.5rem 0 0.85rem !important; }
        .newsletter-content li { display: list-item !important; margin: 0.25rem 0; }
        .newsletter-content li p { margin: 0; }
        .newsletter-content blockquote { border-left: 3px solid #cbd5e1 !important; margin: 0.75rem 0 !important; padding-left: 0.9rem !important; color: #475569; }
        .newsletter-content a { color: #2563eb; text-decoration: underline; }
        .newsletter-content strong { font-weight: 700 !important; }
        .newsletter-content img { max-width: min(100%, 420px) !important; max-height: 240px !important; border-radius: 8px; display: block; margin: 0.75rem 0; }
      `}</style>

      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">Email Preview</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-1 border-b bg-slate-50">
          <p className="text-xs text-slate-500">Subject</p>
          <p className="font-medium text-slate-900">
            {subject || "(no subject)"}
          </p>
          {previewText && (
            <>
              <p className="text-xs text-slate-500 mt-2">Preview text</p>
              <p className="text-sm text-slate-600">{previewText}</p>
            </>
          )}
        </div>

        <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
      </div>
    </div>
  );
}
