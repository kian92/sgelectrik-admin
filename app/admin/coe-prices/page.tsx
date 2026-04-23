// app/admin/coe-prices/page.tsx
// Server Component — exports metadata for SEO, fetches data server-side

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

async function getCoePrices() {
  const { data, error } = await supabaseServer
    .from("coe_prices")
    .select("*")
    .order("cat");

  if (error) throw new Error(error.message);
  return data;
}

export default async function CoePricesAdminPage() {
  const categories = await getCoePrices();

  return <CoePricesClient initialCategories={categories} />;
}
