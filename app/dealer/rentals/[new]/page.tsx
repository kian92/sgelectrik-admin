import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import { RentalFormClient } from "@/app/(common)/rental-form-client";

export const metadata: Metadata = { title: "Add Rental Company | SGElectrik" };

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

export default async function DealerNewRentalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/backoffice/login");

  const dealerId = await getDealerIdByEmail(session.user.email);
  if (!dealerId) redirect("/backoffice/login");

  return (
    <RentalFormClient
      editingId={null}
      initialData={null}
      // Dealer gets no dealers list — dealerId injected from session server-side
      dealers={[]}
      isAdmin={false}
      backHref="/dealer/rentals"
      // Pre-set dealer_id so the form payload always includes it
      fixedDealerId={dealerId}
    />
  );
}
