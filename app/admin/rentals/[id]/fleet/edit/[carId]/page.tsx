import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/app/lib/supabase-server";
import AdminFleetCarPageWrapper from "../../FleetCarPageWrapper";
import type { FleetCar } from "@/app/(common)/FleetCarCard";

type Props = { params: Promise<{ id: string; carId: string }> };

export const metadata: Metadata = {
  title: "Edit Fleet Car | SGElectrik Admin",
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

async function getFleetCar(
  carId: number,
  rentalCompanyId: number,
): Promise<FleetCar | null> {
  const { data, error } = await supabaseServer
    .from("rental_company_fleet")
    .select("*, rental_company_faqs(*)")
    .eq("id", carId)
    .eq("rental_company_id", rentalCompanyId)
    .maybeSingle();

  if (error) {
    console.error("getFleetCar:", error.message);
    return null;
  }
  return data;
}

export default async function AdminEditFleetCarPage({ params }: Props) {
  const { id: rawId, carId: rawCarId } = await params;
  const id = parseInt(rawId);
  const carId = parseInt(rawCarId);
  if (isNaN(id) || isNaN(carId)) notFound();

  const company = await getRentalCompany(id);
  if (!company) notFound();

  const car = await getFleetCar(carId, company.id);
  if (!car) notFound();

  return (
    <AdminFleetCarPageWrapper
      rentalCompanyId={company.id}
      companyName={company.name}
      existing={car}
    />
  );
}
