// app/admin/rentals/new/page.tsx
import { Metadata } from "next";
import { supabaseServer } from "@/app/lib/supabase-server";
import { RentalFormClient } from "@/app/(common)/rental-form-client";

export const metadata: Metadata = {
  title: "Add Rental Company | SGElectrik Admin",
};

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

export default async function NewRentalPage() {
  const dealers = await getDealers();

  return (
    <RentalFormClient
      editingId={null}
      initialData={null}
      dealers={dealers}
      isAdmin={true}
      backHref="/admin/rentals"
    />
  );
}
