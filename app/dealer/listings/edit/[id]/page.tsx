import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import { EditListingForm } from "./EditCarsListing";

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

async function getListingById(carId: string, dealerCarIds: string[]) {
  // Verify this car belongs to the dealer
  if (!dealerCarIds.includes(carId)) return null;

  const { data, error } = await supabaseServer
    .from("cars")
    .select("*")
    .eq("id", carId)
    .maybeSingle();

  if (error) {
    console.error("getListingById:", error.message);
    return null;
  }

  return data;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DealerEditListingPage({ params }: Props) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/backoffice-login");

  const dealer = await getDealerByEmail(session.user.email);
  if (!dealer) redirect("/backoffice-login");

  const car = await getListingById(id, dealer.car_ids ?? []);
  if (!car) notFound();

  // Map DB row → form-friendly shape
  const listing = {
    id: car.id as string,
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
  };

  return <EditListingForm listing={listing} dealerName={dealer.name} />;
}
