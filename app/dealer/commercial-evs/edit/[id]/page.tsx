import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { supabaseServer } from "@/app/lib/supabase-server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CommercialEvForm } from "@/app/(common)/CommercialForm";

type Params = { params: Promise<{ id: string }> };

async function getDealerByEmail(email: string) {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, slug")
    .eq("email", email)
    .eq("role", "dealer")
    .maybeSingle();

  if (error) {
    console.error("getDealerByEmail:", error.message);
    return null;
  }

  return data;
}

async function getEv(id: number) {
  const { data } = await supabaseServer
    .from("commercial_evs")
    .select("*")
    .eq("id", id)
    .single();

  return data ?? null;
}

export default async function DealerEditCommercialEvPage({ params }: Params) {
  const session = await getServerSession(authOptions);

  // ✅ Same auth pattern
  if (!session?.user?.email) redirect("/login");

  const dealer = await getDealerByEmail(session.user.email);
  if (!dealer) redirect("/login");

  const { id } = await params;
  const ev = await getEv(parseInt(id));
  if (!ev) notFound();

  // ✅ Ensure dealer owns this EV
  if (ev.dealer_id !== dealer.id) redirect("/dealer/commercial-evs");

  return (
    <CommercialEvForm
      role="dealer"
      existing={ev}
      dealerId={dealer.id}
      dealerSlug={dealer.slug ?? ""}
      backHref="/dealer/commercial-evs"
    />
  );
}
