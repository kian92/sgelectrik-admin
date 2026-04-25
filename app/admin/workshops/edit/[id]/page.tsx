import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/app/lib/supabase-server";
import WorkshopForm from "@/app/(common)/WorkshopForm";
import type { Workshop } from "@/app/lib/workshop";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) return { title: "Edit Workshop — Admin" };

  const { data } = await supabaseServer
    .from("workshops")
    .select("name")
    .eq("id", id)
    .single();

  return {
    title: data ? `Edit "${data.name}" — Admin` : "Edit Workshop — Admin",
    robots: { index: false, follow: false },
  };
}

async function getWorkshop(id: number): Promise<Workshop> {
  const { data, error } = await supabaseServer
    .from("workshops")
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

export default async function AdminEditWorkshopPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const [workshop, dealers] = await Promise.all([
    getWorkshop(id),
    getDealers(),
  ]);

  return <WorkshopForm workshop={workshop} dealers={dealers} isAdmin={true} />;
}
