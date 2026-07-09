import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import PromotionForm from "@/app/(common)/PromotionForm";
import type { Promotion } from "@/app/lib/promotion";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) return { title: "Edit Promotion" };

  const { data } = await supabaseServer
    .from("promotions")
    .select("title")
    .eq("id", id)
    .single();

  return {
    title: data ? `Edit "${data.title}"` : "Edit Promotion",
    robots: { index: false, follow: false },
  };
}

async function getPromotion(id: number, dealerId: number): Promise<Promotion> {
  const { data, error } = await supabaseServer
    .from("promotions")
    .select("*")
    .eq("id", id)
    .eq("dealer_id", dealerId) // ensure dealer can only edit their own
    .single();

  if (error || !data) notFound();
  return data;
}

export default async function DealerEditPromotionPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/backoffice-login");

  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const promotion = await getPromotion(id, session.user.id);

  return (
    <PromotionForm
      promotion={promotion}
      dealers={[]}
      isAdmin={false}
      sessionDealerId={session.user.id}
    />
  );
}
