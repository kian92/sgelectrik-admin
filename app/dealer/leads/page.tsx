// app/backoffice/leads/page.tsx  — SERVER COMPONENT
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import DealerLeadsClient from "./dealer-leads-client";

export const metadata: Metadata = {
  title: "My Leads | SGElectrik Backoffice",
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  preferred_car: string;
  quiz_answers: string | null;
  recommendation_result: string | null;
  created_at: string;
  dealer_id: number | null;
}

export interface Dealer {
  id: number;
  slug: string;
  name: string;
  short_name: string | null;
  brands: string[];
  car_ids: string[];
}

// ── Server data fetchers ─────────────────────────────────────────────────────

async function getDealerByEmail(email: string): Promise<Dealer | null> {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, slug, name, short_name, brands, car_ids")
    .eq("email", email)
    .eq("role", "dealer")
    .maybeSingle();

  if (error) {
    console.error("getDealerByEmail:", error.message);
    return null;
  }

  return data ?? null;
}

async function getLeadsForDealer(dealerId: number): Promise<Lead[]> {
  const { data, error } = await supabaseServer
    .from("leads")
    .select("*")
    .eq("dealer_id", dealerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getLeadsForDealer:", error.message);
    return [];
  }

  return data ?? [];
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function DealerLeadsPage() {
  const session = await getServerSession(authOptions);

  // Redirect unauthenticated users
  if (!session?.user?.email) {
    redirect("/backoffice/login");
  }

  // Look up dealer row by the logged-in email
  const dealer = await getDealerByEmail(session.user.email);

  if (!dealer) {
    redirect("/backoffice/login");
  }

  // Fetch all leads assigned to this dealer
  const leads = await getLeadsForDealer(dealer.id);

  return <DealerLeadsClient dealer={dealer} initialLeads={leads} />;
}
