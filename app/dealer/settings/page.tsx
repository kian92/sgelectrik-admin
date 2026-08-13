import AccountSettingsForm from "@/app/(common)/AccountSettingsForm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { supabaseServer } from "@/app/lib/supabase-server";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

async function getDealerByEmail(email: string) {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, name, website, phone, area, slug")
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
    .select("*")
    .eq("dealer_id", dealerId)
    .maybeSingle();

  if (error) {
    console.error("getRentalCompanyByDealerId:", error.message);
    return null;
  }
  return data;
}

export default async function DealerSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/backoffice-login");

  const dealer = session.user.email
    ? await getDealerByEmail(session.user.email)
    : null;
  const rentalCompany = dealer
    ? await getRentalCompanyByDealerId(dealer.id)
    : null;

  return (
    <div className="max-w-full mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your account details and password.
        </p>
      </div>
      <AccountSettingsForm
        showDealerFields
        dealerId={dealer?.id}
        initialRentalCompany={rentalCompany}
      />
    </div>
  );
}
