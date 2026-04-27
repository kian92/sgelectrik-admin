import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import DealerRentalsClient from "./dealer-rentals-client";

export const metadata: Metadata = {
  title: "My EV Rentals | SGElectrik Backoffice",
};

export interface RentalCompany {
  id: number;
  slug: string;
  name: string;
  type: string;
  area: string;
  priceFrom: string;
  pricePeriod: string;
  rating: number;
  reviewCount: number;
  fleet: Array<{ id: number; model: string }>;
}

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

async function getRentalsByDealerId(
  dealerId: number,
): Promise<RentalCompany[]> {
  const { data: companies, error } = await supabaseServer
    .from("rental_companies")
    .select("*")
    .eq("dealer_id", dealerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getRentalsByDealerId:", error.message);
    return [];
  }
  if (!companies?.length) return [];

  const { data: fleet } = await supabaseServer
    .from("rental_company_fleet")
    .select("id, rental_company_id, model")
    .in(
      "rental_company_id",
      companies.map((c) => c.id),
    );

  return companies.map((c) => ({
    id: c.id,
    slug: c.slug,
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

export default async function DealerRentalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/backoffice/login");

  const dealerId = await getDealerIdByEmail(session.user.email);
  if (!dealerId) redirect("/backoffice/login");

  const companies = await getRentalsByDealerId(dealerId);

  return (
    <DealerRentalsClient initialCompanies={companies} dealerId={dealerId} />
  );
}
