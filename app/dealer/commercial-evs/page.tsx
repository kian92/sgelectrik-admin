// app/dealer/commercial-evs/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import DealerCommercialEvsClient from "./DealerCommercialEvsClient";

export const dynamic = "force-dynamic";

async function getDealerIdByEmail(email: string): Promise<number | null> {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id")
    .eq("email", email)
    .eq("role", "dealer")
    .maybeSingle();

  if (error) {
    console.error("getDealerIdByEmail:", error.message);
    return null;
  }

  return data?.id ?? null;
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

  if (!session?.user?.email) redirect("/login");

  const dealerId = await getDealerIdByEmail(session.user.email);
  if (!dealerId) redirect("/login");

  const evs = await getEvs(dealerId);

  return <DealerCommercialEvsClient initialEvs={evs} />;
}
