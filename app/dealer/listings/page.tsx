import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import { DealerListingsClient } from "./DealerListingClient";

async function getDealerByEmail(email: string) {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, slug, name, car_ids")
    .eq("email", email)
    .eq("role", "dealer")
    .maybeSingle();

  if (error) {
    console.error("getDealerByEmail:", error.message);
    return null;
  }

  return data;
}

async function getDealerListings(dealerSlug: string) {
  const { data: dealer } = await supabaseServer
    .from("dealers")
    .select("car_ids")
    .eq("slug", dealerSlug)
    .maybeSingle();

  const ids: string[] = dealer?.car_ids ?? [];
  if (ids.length === 0) return [];

  const { data: cars, error } = await supabaseServer
    .from("cars")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getDealerListings:", error.message);
    return [];
  }

  return (cars ?? []).map((car) => ({
    id: car.id as string,
    dealerSlug,
    brand: car.brand as string,
    model: car.model as string,
    carType: car.car_type as string,
    condition: car.condition as string,
    priceMin: car.price_min as number,
    priceMax: car.price_max as number,
    rangeKm: car.range_km as number,
    seats: car.seats as number,
    topSpeed: car.top_speed as number,
    acceleration: car.acceleration as string,
    chargingTimeFast: car.charging_time_fast as string,
    chargingTimeSlow: car.charging_time_slow as string,
    rebateEligible: car.rebate_eligible as boolean,
    rebateAmount: (car.rebate_amount as number | null) ?? null,
    highlights: car.highlights as string,
    description: car.description as string,
    monthlyEstimate: car.monthly_estimate as number,
    year: (car.year as number | null) ?? null,
    mileage: (car.mileage as number | null) ?? null,
    imageUrl: (car.image_url as string) || null,
    status: (car.status as string) ?? "published",
    createdAt: car.created_at as string,
  }));
}

export default async function DealerListingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/backoffice-login");

  const dealer = await getDealerByEmail(session.user.email);
  if (!dealer) redirect("/backoffice-login");

  const listings = await getDealerListings(dealer.slug);

  return (
    <DealerListingsClient
      dealer={{ id: dealer.id, slug: dealer.slug, name: dealer.name }}
      initialListings={listings}
    />
  );
}
