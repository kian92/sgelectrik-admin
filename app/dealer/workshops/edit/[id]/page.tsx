import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import WorkshopForm from "@/app/(common)/WorkshopForm";
import type { Workshop } from "@/app/lib/workshop";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) return { title: "Edit Workshop" };

  const { data } = await supabaseServer
    .from("workshops")
    .select("name")
    .eq("id", id)
    .single();

  return {
    title: data ? `Edit "${data.name}"` : "Edit Workshop",
    robots: { index: false, follow: false },
  };
}

async function getWorkshop(id: number, dealerId: number): Promise<Workshop> {
  const { data, error } = await supabaseServer
    .from("workshops")
    .select("*")
    .eq("id", id)
    .eq("dealer_id", dealerId) // ensure dealer can only edit their own
    .single();

  if (error || !data) notFound();
  return data;
}

export default async function DealerEditWorkshopPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const workshop = await getWorkshop(id, session.user.id);

  return (
    <WorkshopForm
      workshop={workshop}
      dealers={[]}
      isAdmin={false}
      sessionDealerId={session.user.id}
    />
  );
}
