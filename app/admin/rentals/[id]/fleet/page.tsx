import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/app/lib/supabase-server";
import AdminFleetListClient from "./FleetListClient";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Fleet | SGElectrik Admin",
};

async function getRentalCompany(id: number) {
  const { data, error } = await supabaseServer
    .from("rental_companies")
    .select("id, name, rental_company_fleet(*, rental_company_faqs(*))")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getRentalCompany:", error.message);
    return null;
  }
  return data;
}

export default async function AdminFleetPage({ params }: Props) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const company = await getRentalCompany(id);
  if (!company) notFound();

  return (
    <AdminFleetListClient
      rentalCompanyId={company.id}
      companyName={company.name}
      initialFleet={
        Array.isArray(company.rental_company_fleet)
          ? company.rental_company_fleet
          : []
      }
    />
  );
}
