import { notFound } from "next/navigation";
import { supabaseServer } from "@/app/lib/supabase-server";
import NewsletterForm from "../../new/NewsletterForm";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditNewsletterPage({ params }: Props) {
  const { id } = await params;

  const { data: newsletter, error } = await supabaseServer
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !newsletter) {
    notFound();
  }

  if (newsletter.status !== "draft") {
    // Already sent — nothing to edit, bounce to the read-only detail view
    notFound();
  }

  const { data: recipientRows } = await supabaseServer
    .from("newsletter_recipients")
    .select("dealer_id, email")
    .eq("newsletter_id", id);

  let initialSelectedUsers: { id: number; name: string; email: string }[] = [];

  if (newsletter.recipient_type === "selected" && recipientRows?.length) {
    const dealerIds = recipientRows
      .map((r) => r.dealer_id)
      .filter((v): v is number => v !== null);

    const { data: dealers } = await supabaseServer
      .from("dealers")
      .select("id, name, email")
      .in("id", dealerIds);

    initialSelectedUsers = dealers || [];
  }

  const initialCustomEmails =
    newsletter.recipient_type === "custom"
      ? (recipientRows || []).map((r) => r.email).join(", ")
      : "";

  return (
    <NewsletterForm
      isEdit
      newsletterId={newsletter.id}
      initialValues={{
        subject: newsletter.subject,
        previewText: newsletter.preview_text || "",
        contentHtml: newsletter.content_html,
        ctaText: newsletter.cta_text || "",
        ctaUrl: newsletter.cta_url || "",
        recipientType: newsletter.recipient_type,
        selectedUsers: initialSelectedUsers,
        customEmails: initialCustomEmails,
      }}
    />
  );
}
