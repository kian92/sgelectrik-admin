import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import AdminCarsClient from "./AdminCarsClient";

export const metadata: Metadata = {
  title: "Cars | SGElectrik Admin",
};

interface DealerRow {
  id: number;
  name: string;
  slug: string;
  car_ids: string[];
}

interface CarRow {
  id: string;
  name: string;
  brand: string;
  model: string;
  car_type: string;
  condition: string;
  year: number | null;
  price_min: number;
  price_max: number;
  range_km: number;
  image_url: string;
  created_at: string;
  featured: boolean;
}

async function getDealers(): Promise<DealerRow[]> {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, name, slug, car_ids")
    .order("name", { ascending: true });

  if (error) {
    console.error("getDealers:", error.message);
    return [];
  }

  return data ?? [];
}

async function getCars(): Promise<CarRow[]> {
  const { data, error } = await supabaseServer
    .from("cars")
    .select(
      "id, name, brand, model, car_type, condition, year, price_min, price_max, range_km, image_url, created_at, featured",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getCars:", error.message);
    return [];
  }

  return data ?? [];
}

export default async function AdminCarsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    redirect("/backoffice-login");
  }

  const [dealers, cars] = await Promise.all([getDealers(), getCars()]);

  const carsWithDealers = cars.map((car) => {
    const dealer = dealers.find(
      (dealerRow) =>
        Array.isArray(dealerRow.car_ids) && dealerRow.car_ids.includes(car.id),
    );

    return {
      ...car,
      dealerId: dealer?.id ?? null,
      dealerName: dealer?.name ?? "Unassigned",
      dealerSlug: dealer?.slug ?? "",
    };
  });

  return (
    <AdminCarsClient initialCars={carsWithDealers} initialDealers={dealers} />
  );
}
