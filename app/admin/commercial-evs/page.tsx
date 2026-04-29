import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import AdminCommercialEvsClient from "./AdminCommercialEvsClient";

export const dynamic = "force-dynamic";

async function getEvs() {
  const { data } = await supabaseServer
    .from("commercial_evs")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []).map((ev) => ({
    id: ev.id,
    name: ev.name,
    brand: ev.brand,
    category: ev.category,
    year: ev.year,
    priceMin: ev.price_min,
    priceMax: ev.price_max,
    rangeKm: ev.range_km,
    payloadKg: ev.payload_kg,
    status: ev.status,
    dealerSlug: ev.dealer_slug,
  }));
}

export type CommercialEv = Awaited<ReturnType<typeof getEvs>>[number];

export default async function AdminCommercialEvsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/login");

  const evs = await getEvs();

  return <AdminCommercialEvsClient initialEvs={evs} />;
}
