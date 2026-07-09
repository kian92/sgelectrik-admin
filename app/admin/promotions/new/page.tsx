import PromotionForm from "@/app/(common)/PromotionForm";
import { supabaseServer } from "@/app/lib/supabase-server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Promotion — Admin",
  description: "Add a new EV dealer promotion to the platform.",
  robots: { index: false, follow: false },
};

async function getDealers() {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, name, slug")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function AdminNewPromotionPage() {
  const dealers = await getDealers();
  return <PromotionForm dealers={dealers} isAdmin={true} />;
}
