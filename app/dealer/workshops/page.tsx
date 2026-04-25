import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Workshop } from "@/app/lib/workshop";
import { supabaseServer } from "@/app/lib/supabase-server";
import WorkshopsClient from "./WorkshopClient";

export const metadata: Metadata = {
  title: "Workshops — Admin",
  description: "Manage all EV workshops listed on the platform.",
  robots: { index: false, follow: false },
};

async function getWorkshops(
  dealerId: number,
  isAdmin: boolean,
): Promise<Workshop[]> {
  console.log(dealerId, isAdmin);
  let query = supabaseServer
    .from("workshops")
    .select("*, dealers(id, name, slug)")
    .order("created_at", { ascending: false });

  // Dealers only see their own workshops, admins see all
  if (!isAdmin) {
    query = query.eq("dealer_id", dealerId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function WorkshopsAdminPage() {
  const session = await getServerSession(authOptions);
  console.log("SSS", session);

  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "admin";
  const workshops = await getWorkshops(session.user.id, isAdmin);

  return <WorkshopsClient initialWorkshops={workshops} />;
}
