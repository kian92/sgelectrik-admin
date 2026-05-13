import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { CarForm } from "@/app/(common)/CarForm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";

interface Props {
  params: Promise<{ id: string }>;
}

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

async function getCar(id: string) {
  const { data, error } = await supabaseServer
    .from("cars")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getCar:", error.message);
    return null;
  }

  console.log("SSS", id, data);

  return data;
}

export default async function DealerEditCarPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  console.log("papa", id);

  if (!session?.user?.email) redirect("/login");

  const [dealer, car] = await Promise.all([
    getDealerByEmail(session.user.email),
    getCar(id),
  ]);

  if (!dealer) redirect("/login");
  if (!car) notFound();

  // Ensure the dealer only edits their own cars
  // (requires cars table to have a dealer_id column, or check via car_ids on dealers)
  // Uncomment if you add dealer_id to cars:
  // if (car.dealer_id !== dealer.id) redirect("/dealer/cars");

  return (
    <CarForm
      role="dealer"
      dealerId={dealer.id}
      dealerSlug={dealer.slug ?? ""}
      existing={car}
      backHref="/dealer/cars"
    />
  );
}
