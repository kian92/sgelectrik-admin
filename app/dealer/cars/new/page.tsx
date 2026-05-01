import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { CarForm } from "@/app/(common)/CarForm";
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

export default async function DealerNewCarPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) redirect("/login");

  const dealer = await getDealerByEmail(session.user.email);
  if (!dealer) redirect("/login");

  return (
    <CarForm
      role="dealer"
      dealerId={dealer.id}
      dealerSlug={dealer.slug ?? ""}
      backHref="/dealer/cars"
    />
  );
}
