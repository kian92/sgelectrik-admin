import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/app/lib/supabase-server";
import PromotionForm from "@/app/(common)/PromotionForm";
import type { Promotion } from "@/app/lib/promotion";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) return { title: "Edit Promotion — Admin" };

  const { data } = await supabaseServer
    .from("promotions")
    .select("title")
    .eq("id", id)
    .single();

  return {
    title: data ? `Edit "${data.title}" — Admin` : "Edit Promotion — Admin",
    robots: { index: false, follow: false },
  };
}

async function getPromotion(id: number): Promise<Promotion> {
  const { data, error } = await supabaseServer
    .from("promotions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) notFound();
  return data;
}

async function getDealers() {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, name, slug")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function AdminEditPromotionPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const [promotion, dealers] = await Promise.all([
    getPromotion(id),
    getDealers(),
  ]);

  return (
    <PromotionForm promotion={promotion} dealers={dealers} isAdmin={true} />
  );
}
