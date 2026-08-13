import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import FleetCarPageWrapper from "../FleetCarPageWrapper";

export const metadata: Metadata = {
  title: "Add Fleet Car",
  robots: { index: false, follow: false },
};

async function getDealerByEmail(email: string) {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id")
    .eq("email", email)
    .eq("role", "dealer")
    .maybeSingle();

  if (error) {
    console.error("getDealerByEmail:", error.message);
    return null;
  }
  return data;
}

async function getRentalCompanyId(dealerId: number): Promise<number | null> {
  const { data, error } = await supabaseServer
    .from("rental_companies")
    .select("id")
    .eq("dealer_id", dealerId)
    .maybeSingle();

  if (error) {
    console.error("getRentalCompanyId:", error.message);
    return null;
  }
  return data?.id ?? null;
}

export default async function DealerNewFleetCarPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/backoffice-login");

  const dealer = await getDealerByEmail(session.user.email);
  if (!dealer) redirect("/backoffice-login");

  const rentalCompanyId = await getRentalCompanyId(dealer.id);
  if (!rentalCompanyId) redirect("/dealer/rentals");

  return <FleetCarPageWrapper rentalCompanyId={rentalCompanyId} />;
}
