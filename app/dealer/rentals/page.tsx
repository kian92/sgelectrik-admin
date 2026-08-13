import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { Car } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import { Button } from "@/components/ui/button";
import DealerRentalsClient from "./dealer-rentals-client";

export const metadata: Metadata = {
  title: "My EV Rentals | SGElectrik Backoffice",
};

async function getDealerByEmail(email: string) {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, name, website, phone, area")
    .eq("email", email)
    .eq("role", "dealer")
    .maybeSingle();

  if (error) {
    console.error("getDealerByEmail:", error.message);
    return null;
  }
  return data;
}

async function getRentalCompanyByDealerId(dealerId: number) {
  const { data, error } = await supabaseServer
    .from("rental_companies")
    .select("*, rental_company_fleet(*), rental_company_faqs(*)")
    .eq("dealer_id", dealerId)
    .maybeSingle();

  if (error) {
    console.error("getRentalCompanyByDealerId:", error.message);
    return null;
  }
  return data;
}

export default async function DealerRentalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/backoffice-login");

  const dealer = await getDealerByEmail(session.user.email);
  if (!dealer) redirect("/backoffice-login");

  const company = await getRentalCompanyByDealerId(dealer.id);

  if (!company) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Car className="h-6 w-6 text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Set up your rental profile first
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Before you can list EV rental cars, set up your rental profile —
          pick at least one rental type to get started.
        </p>
        <Link href="/dealer/settings#rental-profile">
          <Button className="gap-2">Go to Settings</Button>
        </Link>
      </div>
    );
  }

  return (
    <DealerRentalsClient
      rentalCompanyId={company.id}
      initialFleet={
        Array.isArray(company.rental_company_fleet)
          ? company.rental_company_fleet
          : []
      }
      initialFaqs={
        Array.isArray(company.rental_company_faqs)
          ? company.rental_company_faqs
          : []
      }
    />
  );
}
