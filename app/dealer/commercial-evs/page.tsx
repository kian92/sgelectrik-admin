// app/dealer/commercial-evs/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import DealerCommercialEvsClient from "./DealerCommercialEvsClient";

export const dynamic = "force-dynamic";

async function getDealer(email: string): Promise<{ id: number; car_ids: number[] | null } | null> {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, car_ids")
    .eq("email", email)
    .eq("role", "dealer")
    .maybeSingle();

  if (error) {
    console.error("getDealer:", error.message);
    return null;
  }

  return data ?? null;
}

async function getEvs(dealerId: number) {
  const { data } = await supabaseServer
    .from("commercial_evs")
    .select("*")
    .eq("dealer_id", dealerId)
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

export type DealerCommercialEv = Awaited<ReturnType<typeof getEvs>>[number];

export default async function DealerCommercialEvsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/backoffice-login");

  const dealer = await getDealer(session.user.email);
  if (!dealer) redirect("/backoffice-login");

  const evs = await getEvs(dealer.id);
  const carCount = Array.isArray(dealer.car_ids) ? dealer.car_ids.length : 0;

  return <DealerCommercialEvsClient initialEvs={evs} carCount={carCount} />;
}
