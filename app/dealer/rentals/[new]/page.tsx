import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import { RentalFormClient } from "@/app/(common)/rental-form-client";

export const metadata: Metadata = { title: "Add Rental Company | SGElectrik" };

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

async function hasExistingRental(dealerId: number): Promise<boolean> {
  const { data } = await supabaseServer
    .from("rental_companies")
    .select("id")
    .eq("dealer_id", dealerId)
    .limit(1)
    .maybeSingle();
  return !!data;
}

export default async function DealerNewRentalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/backoffice-login");

  const dealer = await getDealerByEmail(session.user.email);
  if (!dealer) redirect("/backoffice-login");

  // Dealers get one rental listing — if they already have one, send them
  // there instead of letting a second one collide on auto-derived identity.
  if (await hasExistingRental(dealer.id)) {
    redirect("/dealer/rentals");
  }

  return (
    <RentalFormClient
      editingId={null}
      initialData={null}
      // Dealer gets no dealers list — dealerId injected from session server-side
      dealers={[]}
      isAdmin={false}
      backHref="/dealer/rentals"
      // Pre-set dealer_id so the form payload always includes it
      fixedDealerId={dealer.id}
      dealerInfo={{
        name: dealer.name ?? "",
        website: dealer.website ?? "",
        phone: dealer.phone ?? "",
        area: dealer.area ?? "",
      }}
    />
  );
}
