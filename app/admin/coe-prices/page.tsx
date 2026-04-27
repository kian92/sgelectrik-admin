import type { Metadata } from "next";
import { supabaseServer } from "@/app/lib/supabase-server";
import CoePricesClient from "./CoePricesClient";

export const metadata: Metadata = {
  title: "COE Prices | Admin Dashboard",
  description:
    "Manage and update Certificate of Entitlement (COE) prices for all categories after each LTA bidding exercise.",
  robots: { index: false, follow: false }, // admin pages should not be indexed
  openGraph: {
    title: "COE Prices | Admin Dashboard",
    description:
      "Manage and update Certificate of Entitlement (COE) prices for all categories.",
    type: "website",
  },
};

const LIMIT = 5;

export default async function CoePricesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;

  const page = Number(params.page || 1);

  // First get total count ONLY
  const { count } = await supabaseServer
    .from("coe_prices")
    .select("*", { count: "exact", head: true });

  const total = count || 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // ✅ Clamp page to valid range
  const safePage = Math.min(page, totalPages);

  const from = (safePage - 1) * LIMIT;
  const to = from + LIMIT - 1;

  const { data, error } = await supabaseServer
    .from("coe_prices")
    .select("*")
    .order("cat")
    .range(from, to);

  if (error) throw new Error(error.message);

  return (
    <CoePricesClient
      initialCategories={data || []}
      total={total}
      page={safePage}
      limit={LIMIT}
    />
  );
}
