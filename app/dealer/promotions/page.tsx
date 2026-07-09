import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Promotion } from "@/app/lib/promotion";
import { supabaseServer } from "@/app/lib/supabase-server";
import PromotionsClient from "@/app/(common)/PromotionsClient";

export const metadata: Metadata = {
  title: "Promotions — Dealer",
  description: "Manage your EV promotions and roadshows.",
  robots: { index: false, follow: false },
};

async function getPromotions(
  dealerId: number,
  isAdmin: boolean,
): Promise<Promotion[]> {
  let query = supabaseServer
    .from("promotions")
    .select("*, dealers(id, name, slug)")
    .order("created_at", { ascending: false });

  // Dealers only see their own promotions, admins see all
  if (!isAdmin) {
    query = query.eq("dealer_id", dealerId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function DealerPromotionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/backoffice-login");

  const isAdmin = session.user.role === "admin";
  const promotions = await getPromotions(session.user.id, isAdmin);

  return (
    <PromotionsClient
      initialPromotions={promotions}
      basePath="/dealer/promotions"
    />
  );
}
