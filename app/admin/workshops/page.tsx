import type { Metadata } from "next";
import { Workshop } from "@/app/lib/workshop";
import { supabaseServer } from "@/app/lib/supabase-server";
import WorkshopsClient from "./WorkshopClient";

export const metadata: Metadata = {
  title: "Workshops — Admin",
  description: "Manage all EV workshops listed on the platform.",
  robots: { index: false, follow: false }, // Admin pages should not be indexed
};

async function getWorkshops(): Promise<Workshop[]> {
  const { data, error } = await supabaseServer
    .from("workshops")
    .select("*, dealers(id, name, slug)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function WorkshopsAdminPage() {
  const workshops = await getWorkshops();

  return <WorkshopsClient initialWorkshops={workshops} />;
}
