"use client";

import { useState } from "react";
import { ArrowLeft, Send, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NewsletterEditor from "./NewsletterEditor";
import UserSelector from "./UserSelector";
import ConfirmSendModal from "./ConfirmSendModal";
import PreviewModal from "./PreviewModal";

type Dealer = { id: number; name: string; email: string };

type InitialValues = {
  subject: string;
  previewText: string;
  contentHtml: string;
  ctaText: string;
  ctaUrl: string;
  recipientType: "all" | "selected" | "custom";
  selectedUsers: Dealer[];
  customEmails: string;
};

type Props = {
  isEdit?: boolean;
  newsletterId?: string;
  initialValues?: InitialValues;
};

export default function NewsletterForm({
  isEdit = false,
  newsletterId,
  initialValues,
}: Props) {
  const router = useRouter();

  const [subject, setSubject] = useState(initialValues?.subject || "");
  const [previewText, setPreviewText] = useState(
    initialValues?.previewText || "",
  );
  const [recipientType, setRecipientType] = useState<
    "all" | "selected" | "custom"
  >(initialValues?.recipientType || "all");
  const [customEmails, setCustomEmails] = useState(
    initialValues?.customEmails || "",
  );
  const [selectedUsers, setSelectedUsers] = useState<Dealer[]>(
    initialValues?.selectedUsers || [],
  );
  const [contentHtml, setContentHtml] = useState(
    initialValues?.contentHtml || "",
  );
  const [ctaText, setCtaText] = useState(initialValues?.ctaText || "");
  const [ctaUrl, setCtaUrl] = useState(initialValues?.ctaUrl || "");
  const [submitting, setSubmitting] = useState<"draft" | "send" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // add state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [recipientCount, setRecipientCount] = useState(0);
  const [countLoading, setCountLoading] = useState(false);
  // add state
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function handleSendTest() {
    setTestResult(null);

    if (!subject.trim() || !contentHtml.trim()) {
      setTestResult({
        ok: false,
        message: "Fill in subject and content first.",
      });
      return;
    }

    setTestSending(true);
    try {
      const res = await fetch("/api/admin/newsletter/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testEmail,
          subject,
          previewText,
          contentHtml,
          ctaText,
          ctaUrl,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setTestResult({
          ok: false,
          message: data.error || "Failed to send test email.",
        });
        return;
      }
      setTestResult({ ok: true, message: `Test email sent to ${testEmail}.` });
    } catch (err) {
      console.error(err);
      setTestResult({
        ok: false,
        message: "Network error — please try again.",
      });
    } finally {
      setTestSending(false);
    }
  }

  async function openSendConfirm() {
    setErrorMsg("");
    if (!subject.trim()) return setErrorMsg("Email subject is required.");
    if (!contentHtml.trim())
      return setErrorMsg("Newsletter content is required.");
    if (recipientType === "selected" && selectedUsers.length === 0)
      return setErrorMsg("Select at least one user.");
    if (recipientType === "custom" && !customEmails.trim())
      return setErrorMsg("Enter at least one email address.");

    setCountLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter/recipient-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType,
          selectedUserIds: selectedUsers.map((u) => u.id),
          customEmails,
        }),
      });
      const data = await res.json();
      setRecipientCount(data.count || 0);
      setConfirmOpen(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to check recipient count.");
    } finally {
      setCountLoading(false);
    }
  }

  async function confirmSend() {
    setConfirmOpen(false);
    await handleSubmit("send"); // your existing submit logic
  }

  // in the JSX, replace the Send Newsletter button's onClick:

  async function handleSubmit(action: "draft" | "send") {
    setErrorMsg("");

    if (!subject.trim()) return setErrorMsg("Email subject is required.");
    if (!contentHtml.trim())
      return setErrorMsg("Newsletter content is required.");
    if (recipientType === "selected" && selectedUsers.length === 0)
      return setErrorMsg("Select at least one user.");
    if (recipientType === "custom" && !customEmails.trim())
      return setErrorMsg("Enter at least one email address.");

    setSubmitting(action);

    try {
      const payload = {
        subject,
        previewText,
        contentHtml,
        ctaText,
        ctaUrl,
        recipientType,
        selectedUserIds: selectedUsers.map((u) => u.id),
        customEmails,
        action,
      };

      let res: Response;

      if (isEdit && newsletterId) {
        // Save changes first
        res = await fetch(`/api/admin/newsletter/${newsletterId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || "Failed to save changes.");
          return;
        }

        // If they hit "Send Newsletter", trigger the send after saving
        if (action === "send") {
          const sendRes = await fetch(
            `/api/admin/newsletter/${newsletterId}/send`,
            {
              method: "POST",
            },
          );
          const sendData = await sendRes.json();
          if (!sendRes.ok) {
            setErrorMsg(sendData.error || "Saved, but sending failed.");
            return;
          }
        }
      } else {
        res = await fetch("/api/admin/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || "Something went wrong.");
          return;
        }
      }

      router.push("/admin/newsletter");
    } catch (err) {
      console.error("Newsletter submit failed:", err);
      setErrorMsg("Network error — please try again.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/newsletter"
          className="rounded-lg border p-2 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? "Edit Newsletter" : "Create Newsletter"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create and send an email broadcast.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="rounded-xl border bg-white p-6 space-y-5">
        <h2 className="text-lg font-semibold">Newsletter Details</h2>
        <div>
          <label className="block text-sm font-medium mb-2">
            Email Subject
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Preview Text</label>
          <input
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="Optional email preview text"
            className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 space-y-5">
        <h2 className="text-lg font-semibold">Recipients</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["all", "selected", "custom"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setRecipientType(type)}
              className={`rounded-lg border p-4 text-left ${
                recipientType === type
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200"
              }`}
            >
              <div className="font-medium">
                {type === "all"
                  ? "All Users"
                  : type === "selected"
                    ? "Selected Users"
                    : "Custom Emails"}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {type === "all"
                  ? "Send to all active users"
                  : type === "selected"
                    ? "Search and select users"
                    : "Enter email addresses manually"}
              </div>
            </button>
          ))}
        </div>

        {recipientType === "selected" && (
          <UserSelector selected={selectedUsers} onChange={setSelectedUsers} />
        )}

        {recipientType === "custom" && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Email Addresses
            </label>
            <textarea
              value={customEmails}
              onChange={(e) => setCustomEmails(e.target.value)}
              placeholder="john@example.com, jane@example.com"
              rows={5}
              className="w-full rounded-lg border px-3 py-2.5"
            />
            <p className="text-xs text-slate-500 mt-2">
              Separate multiple emails using commas or new lines.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Newsletter Content</h2>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Preview Email
          </button>
        </div>

        <NewsletterEditor value={contentHtml} onChange={setContentHtml} />
      </div>
      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        subject={subject}
        previewText={previewText}
        contentHtml={contentHtml}
        ctaText={ctaText}
        ctaUrl={ctaUrl}
      />
      {/* JSX — place after the Newsletter Content block */}
      <div className="rounded-xl border bg-white p-6 space-y-3">
        <h2 className="text-lg font-semibold">Send Test Email</h2>
        <p className="text-sm text-slate-500">
          Send yourself a preview copy before broadcasting to real recipients.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 rounded-lg border px-3 py-2.5"
          />
          <button
            type="button"
            onClick={handleSendTest}
            disabled={testSending}
            className="rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            {testSending ? "Sending..." : "Send Test"}
          </button>
        </div>
        {testResult && (
          <p
            className={`text-sm ${testResult.ok ? "text-emerald-600" : "text-red-600"}`}
          >
            {testResult.message}
          </p>
        )}
      </div>

      <div className="rounded-xl border bg-white p-6 space-y-5">
        <h2 className="text-lg font-semibold">Call To Action</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Button Text
            </label>
            <input
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Learn More"
              className="w-full rounded-lg border px-3 py-2.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Button URL</label>
            <input
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://sgelectrik.com"
              className="w-full rounded-lg border px-3 py-2.5"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          disabled={submitting !== null}
          onClick={() => handleSubmit("draft")}
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {submitting === "draft" ? "Saving..." : "Save Draft"}
        </button>

        <button
          type="button"
          disabled={submitting !== null || countLoading}
          onClick={openSendConfirm}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {countLoading ? "Checking..." : "Send Newsletter"}
        </button>

        <ConfirmSendModal
          open={confirmOpen}
          count={recipientCount}
          loading={submitting === "send"}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={confirmSend}
        />
      </div>
    </div>
  );
}
