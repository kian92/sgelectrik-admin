import { supabaseServer } from "@/app/lib/supabase-server";
import AdminLeadsClient from "./admin-leads";

const LIMIT = 6;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; quizPage?: string }>;
}) {
  const params = await searchParams; // ✅ unwrap

  const page = Number(params.page || 1);
  const from = (page - 1) * LIMIT;
  const to = from + LIMIT - 1;

  const quizPage = Number(params.quizPage || 1);
  const quizFrom = (quizPage - 1) * LIMIT;
  const quizTo = quizFrom + LIMIT - 1;

  const { data, count } = await supabaseServer
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data: quizSubmissions, count: quizCount } = await supabaseServer
    .from("quiz_submissions")
    .select("*", { count: "exact" })
    .order("submitted_at", { ascending: false })
    .range(quizFrom, quizTo);

  return (
    <AdminLeadsClient
      initialLeads={data || []}
      total={count || 0}
      quizSubmissions={quizSubmissions || []}
      quizTotal={quizCount || 0}
      page={page}
      quizPage={quizPage}
      limit={LIMIT}
    />
  );
}
