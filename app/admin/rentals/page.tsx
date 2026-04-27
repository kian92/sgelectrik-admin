import { Metadata } from "next";
import { supabaseServer } from "@/app/lib/supabase-server";
import RentalsAdminClient from "./rentals-admin-client";

export const metadata: Metadata = {
  title: "EV Rentals | SGElectrik Admin",
};

export interface RentalCompany {
  id: number;
  slug: string;
  dealerId: number;
  name: string;
  type: string;
  area: string;
  priceFrom: string;
  pricePeriod: string;
  rating: number;
  reviewCount: number;
  fleet: Array<{ id: number; model: string }>;
}

async function getRentalCompanies(): Promise<RentalCompany[]> {
  const { data: companies, error: companiesError } = await supabaseServer
    .from("rental_companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (companiesError) {
    console.error("getRentalCompanies:", companiesError.message);
    return [];
  }

  const { data: fleet } = await supabaseServer
    .from("rental_company_fleet")
    .select("id, rental_company_id, model");

  return (companies ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    dealerId: c.dealer_id,
    name: c.name,
    type: c.type,
    area: c.area,
    priceFrom: c.price_from,
    pricePeriod: c.price_period,
    rating: Number(c.rating),
    reviewCount: c.review_count,
    fleet: (fleet ?? [])
      .filter((f) => f.rental_company_id === c.id)
      .map((f) => ({ id: f.id, model: f.model })),
  }));
}

export default async function RentalsAdminPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const companies = await getRentalCompanies();
  const page = Number(searchParams.page || 1);

  return <RentalsAdminClient initialCompanies={companies} initialPage={page} />;
}
