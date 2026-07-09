import type { Metadata } from "next";
import { Promotion } from "@/app/lib/promotion";
import { supabaseServer } from "@/app/lib/supabase-server";
import PromotionsClient from "@/app/(common)/PromotionsClient";

export const metadata: Metadata = {
  title: "Promotions — Admin",
  description: "Manage all EV dealer promotions and roadshows on the platform.",
  robots: { index: false, follow: false },
};

async function getPromotions(): Promise<Promotion[]> {
  const { data, error } = await supabaseServer
    .from("promotions")
    .select("*, dealers(id, name, slug)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function AdminPromotionsPage() {
  const promotions = await getPromotions();

  return (
    <PromotionsClient
      initialPromotions={promotions}
      basePath="/admin/promotions"
    />
  );
}
