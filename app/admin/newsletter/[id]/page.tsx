import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Pencil } from "lucide-react";
import { supabaseServer } from "@/app/lib/supabase-server";
import SendButton from "./SendButton";
import { buildNewsletterEmailHtml } from "@/app/lib/newsletter-email-template";

export const dynamic = "force-dynamic";

type Props = {
  params: { id: string };
};
export default async function NewsletterDetailPage({ params }: Props) {
  const { id } = await params;

  const { data: newsletter, error } = await supabaseServer
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !newsletter) {
    notFound();
  }

  const { data: recipients, error: recipientsError } = await supabaseServer
    .from("newsletter_recipients")
    .select("*")
    .eq("newsletter_id", id)
    .order("created_at", { ascending: true });

  if (recipientsError) {
    console.error("Failed to fetch recipients:", recipientsError);
  }
  const fullEmailHtml = buildNewsletterEmailHtml({
    contentHtml: newsletter.content_html,
    ctaText: newsletter.cta_text,
    ctaUrl: newsletter.cta_url,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/newsletter"
          className="rounded-lg border p-2 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {newsletter.subject}
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Created {new Date(newsletter.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={newsletter.status} />
          {newsletter.status !== "sent" && <SendButton id={newsletter.id} />}
        </div>

        {newsletter.status === "draft" && (
          <Link
            href={`/admin/newsletter/${newsletter.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-xl border bg-white p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryStat label="Recipients" value={newsletter.total_recipients} />
        <SummaryStat
          label="Successful"
          value={newsletter.successful_sends}
          className="text-emerald-600"
        />
        <SummaryStat
          label="Failed"
          value={newsletter.failed_sends}
          className="text-red-600"
        />
        <SummaryStat
          label="Sent At"
          value={
            newsletter.sent_at
              ? new Date(newsletter.sent_at).toLocaleString()
              : "—"
          }
        />
      </div>

      {/* Details */}
      <div className="rounded-xl border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Details</h2>

        {newsletter.preview_text && (
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1">
              Preview Text
            </div>
            <div className="text-sm text-slate-700">
              {newsletter.preview_text}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs font-medium text-slate-500 mb-1">
            Recipient Type
          </div>
          <div className="text-sm text-slate-700 capitalize">
            {newsletter.recipient_type}
          </div>
        </div>

        {(newsletter.cta_text || newsletter.cta_url) && (
          <div>
            <div className="text-xs font-medium text-slate-500 mb-1">
              Call To Action
            </div>
            <div className="text-sm text-slate-700">
              {newsletter.cta_text || "—"}{" "}
              {newsletter.cta_url && (
                <span className="text-slate-400">→ {newsletter.cta_url}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content preview */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Content</h2>
        <div dangerouslySetInnerHTML={{ __html: fullEmailHtml }} />
      </div>

      {/* Recipients table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold">Recipients</h2>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Email</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Sent At</th>
                <th className="text-left px-5 py-3 font-semibold">Error</th>
              </tr>
            </thead>

            <tbody>
              {!recipients || recipients.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    <Mail className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                    No recipients yet. This newsletter is still a draft.
                  </td>
                </tr>
              ) : (
                recipients.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-5 py-3">{r.email}</td>
                    <td className="px-5 py-3">
                      <RecipientStatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {r.sent_at ? new Date(r.sent_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-3 text-red-600 text-xs">
                      {r.error_message || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold text-slate-900 ${className}`}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    sending: "bg-blue-100 text-blue-700",
    sent: "bg-emerald-100 text-emerald-700",
    partially_failed: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${
        classes[status] || classes.draft
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function RecipientStatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending: "bg-slate-100 text-slate-700",
    sent: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        classes[status] || classes.pending
      }`}
    >
      {status}
    </span>
  );
}
