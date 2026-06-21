import type { Metadata } from "next";
import { supabaseServer } from "@/app/lib/supabase-server";
import CoeHistoryClient from "./CoeHistoryClient";

export const metadata: Metadata = {
  title: "COE History | Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function CoeHistoryPage() {
  const { data, error } = await supabaseServer
    .from("coe_history")
    .select("*")
    .order("exercise_date", { ascending: false });

  if (error) throw new Error(error.message);

  return <CoeHistoryClient initialRows={data || []} />;
}
