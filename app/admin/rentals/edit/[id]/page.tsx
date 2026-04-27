// app/admin/rentals/new/page.tsx  — for creating
// app/admin/rentals/edit/[id]/page.tsx  — for editing
// Both re-use RentalFormClient; this file is the [id] edit version.
// Duplicate as app/admin/rentals/new/page.tsx passing no initialData.

import { Metadata } from "next";
import { supabaseServer } from "@/app/lib/supabase-server";
import { RentalFormClient } from "@/app/(common)/rental-form-client";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Edit Rental Company | SGElectrik Admin",
};

async function getRentalCompany(id: string) {
  const { data, error } = await supabaseServer
    .from("rental_companies")
    .select("*, rental_company_fleet(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getRentalCompany:", error.message);
    return null;
  }
  return data;
}

async function getDealers() {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, slug, name, short_name")
    .eq("role", "dealer")
    .eq("status", "active")
    .order("name");

  if (error) {
    console.error("getDealers:", error.message);
    return [];
  }
  return data ?? [];
}

export default async function EditRentalPage({ params }: Props) {
  const { id } = await params;
  const [company, dealers] = await Promise.all([
    getRentalCompany(id),
    getDealers(),
  ]);

  return (
    <RentalFormClient
      editingId={Number(id)}
      initialData={company}
      dealers={dealers}
      isAdmin={true}
      backHref="/admin/rentals"
    />
  );
}
