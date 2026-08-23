import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/app/lib/supabase-server";
import AdminFleetCarPageWrapper from "../FleetCarPageWrapper";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Add Fleet Car | SGElectrik Admin",
  robots: { index: false, follow: false },
};

async function getRentalCompany(id: number) {
  const { data, error } = await supabaseServer
    .from("rental_companies")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getRentalCompany:", error.message);
    return null;
  }
  return data;
}

export default async function AdminNewFleetCarPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const company = await getRentalCompany(id);
  if (!company) notFound();

  return (
    <AdminFleetCarPageWrapper
      rentalCompanyId={company.id}
      companyName={company.name}
    />
  );
}
