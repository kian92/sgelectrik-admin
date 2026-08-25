import Link from "next/link";
import { Plus, Mail } from "lucide-react";
import { supabaseServer } from "@/app/lib/supabase-server";
import DeleteButton from "./DeleteButton";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  const { data: newsletters, error } = await supabaseServer
    .from("newsletters")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch newsletters:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Newsletter</h1>

          <p className="text-sm text-slate-500 mt-1">
            Create and manage email broadcasts.
          </p>
        </div>

        <Link
          href="/admin/newsletter/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Create Newsletter
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-5 py-4 font-semibold">Subject</th>

                <th className="text-left px-5 py-4 font-semibold">
                  Recipients
                </th>

                <th className="text-left px-5 py-4 font-semibold">
                  Successful
                </th>

                <th className="text-left px-5 py-4 font-semibold">Failed</th>

                <th className="text-left px-5 py-4 font-semibold">Status</th>

                <th className="text-left px-5 py-4 font-semibold">Created</th>
                <th className="text-left px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!newsletters || newsletters.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    <Mail className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                    No newsletters yet.
                  </td>
                </tr>
              ) : (
                newsletters.map((newsletter) => (
                  <tr
                    key={newsletter.id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/newsletter/${newsletter.id}`}
                        className="font-medium text-slate-900 hover:text-emerald-600"
                      >
                        {newsletter.subject}
                      </Link>
                    </td>

                    <td className="px-5 py-4">{newsletter.total_recipients}</td>

                    <td className="px-5 py-4 text-emerald-600">
                      {newsletter.successful_sends}
                    </td>

                    <td className="px-5 py-4 text-red-600">
                      {newsletter.failed_sends}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={newsletter.status} />
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {new Date(newsletter.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <DeleteButton id={newsletter.id} />
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
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        classes[status] || classes.draft
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
