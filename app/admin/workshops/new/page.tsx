import WorkshopForm from "@/app/(common)/WorkshopForm";
import { supabaseServer } from "@/app/lib/supabase-server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Workshop — Admin",
  description: "Add a new EV workshop to the platform.",
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

export default async function NewWorkshopPage() {
  const dealers = await getDealers();
  return <WorkshopForm dealers={dealers} isAdmin={true} />;
}
