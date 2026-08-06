import { supabaseServer } from "@/app/lib/supabase-server";
import AdminDealersClient from "./admin-dealers";

const LIMIT = 6;

async function getCarOptions() {
  const { data, error } = await supabaseServer
    .from("cars")
    .select("id, name, brand, model")
    .neq("status", "inactive")
    .order("name", { ascending: true });

  if (error) {
    console.error("getCarOptions:", error.message);
    return [];
  }

  return data ?? [];
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;

  const page = Number(params.page || 1);
  const from = (page - 1) * LIMIT;
  const to = from + LIMIT - 1;

  const [{ data, count }, carOptions] = await Promise.all([
    supabaseServer
      .from("dealers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to),
    getCarOptions(),
  ]);

  return (
    <AdminDealersClient
      key={page}
      initialDealers={data || []}
      total={count || 0}
      page={page}
      limit={LIMIT}
      carOptions={carOptions}
    />
  );
}
