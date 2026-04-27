import { supabaseServer } from "@/app/lib/supabase-server";
import AdminDealersClient from "./admin-dealers";

const LIMIT = 6;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;

  const page = Number(params.page || 1);
  const from = (page - 1) * LIMIT;
  const to = from + LIMIT - 1;

  const { data, count } = await supabaseServer
    .from("dealers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  return (
    <AdminDealersClient
      initialDealers={data || []}
      total={count || 0}
      page={page}
      limit={LIMIT}
    />
  );
}
