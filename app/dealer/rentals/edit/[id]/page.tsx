import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import FleetCarPageWrapper from "../../FleetCarPageWrapper";
import type { FleetCar } from "@/app/(common)/FleetCarCard";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Edit Fleet Car",
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

async function getFleetCar(
  id: number,
  rentalCompanyId: number,
): Promise<FleetCar | null> {
  const { data, error } = await supabaseServer
    .from("rental_company_fleet")
    .select("*")
    .eq("id", id)
    .eq("rental_company_id", rentalCompanyId)
    .maybeSingle();

  if (error) {
    console.error("getFleetCar:", error.message);
    return null;
  }
  return data;
}

export default async function DealerEditFleetCarPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/backoffice-login");

  const dealer = await getDealerByEmail(session.user.email);
  if (!dealer) redirect("/backoffice-login");

  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const rentalCompanyId = await getRentalCompanyId(dealer.id);
  if (!rentalCompanyId) redirect("/dealer/rentals");

  const car = await getFleetCar(id, rentalCompanyId);
  if (!car) notFound();

  return (
    <FleetCarPageWrapper rentalCompanyId={rentalCompanyId} existing={car} />
  );
}
