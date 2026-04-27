import { supabaseServer } from "@/app/lib/supabase-server";
import AdminLeadsClient from "./admin-leads";

const LIMIT = 6;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams; // ✅ unwrap

  const page = Number(params.page || 1);
  const from = (page - 1) * LIMIT;
  const to = from + LIMIT - 1;

  const { data, count } = await supabaseServer
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  return (
    <AdminLeadsClient
      initialLeads={data || []}
      total={count || 0}
      page={page}
      limit={LIMIT}
    />
  );
}
