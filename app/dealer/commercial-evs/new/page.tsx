import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { CommercialEvForm } from "@/app/(common)/CommercialForm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";

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

export default async function DealerNewCommercialEvPage() {
  const session = await getServerSession(authOptions);

  // ✅ Same pattern as rentals
  if (!session?.user?.email) redirect("/login");

  const dealer = await getDealerByEmail(session.user.email);
  if (!dealer) redirect("/login");

  return (
    <CommercialEvForm
      role="dealer"
      dealerId={dealer.id}
      dealerSlug={dealer.slug ?? ""}
      backHref="/dealer/commercial-evs"
    />
  );
}
