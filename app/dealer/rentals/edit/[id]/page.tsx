import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import { RentalFormClient } from "@/app/(common)/rental-form-client";

export const metadata: Metadata = { title: "Edit Rental Company | SGElectrik" };

interface Props {
  params: Promise<{ id: string }>;
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

async function getRentalCompany(id: string, dealerId: number) {
  const { data, error } = await supabaseServer
    .from("rental_companies")
    .select("*, rental_company_fleet(*)")
    .eq("id", id)
    // Ensure the dealer can only edit their own company
    .eq("dealer_id", dealerId)
    .maybeSingle();

  if (error) {
    console.error("getRentalCompany:", error.message);
    return null;
  }
  return data;
}

export default async function DealerEditRentalPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/backoffice/login");

  const dealerId = await getDealerIdByEmail(session.user.email);
  if (!dealerId) redirect("/backoffice/login");

  const company = await getRentalCompany(id, dealerId);
  if (!company) notFound();

  return (
    <RentalFormClient
      editingId={Number(id)}
      initialData={company}
      dealers={[]}
      isAdmin={false}
      backHref="/dealer/rentals"
      fixedDealerId={dealerId}
    />
  );
}
