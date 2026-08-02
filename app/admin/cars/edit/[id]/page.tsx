import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import { CarForm } from "@/app/(common)/CarForm";

interface Props {
  params: Promise<{ id: string }>;
}

async function getDealers() {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, slug, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("getDealers:", error.message);
    return [];
  }

  return data ?? [];
}

async function getCar(id: string) {
  const carId = Number(id);
  if (!Number.isInteger(carId)) return null;

  const { data, error } = await supabaseServer
    .from("cars")
    .select("*")
    .eq("id", carId)
    .maybeSingle();

  if (error) {
    console.error("getCar:", error.message);
    return null;
  }

  return data;
}

async function getAssignedDealer(id: string) {
  const carId = Number(id);
  if (!Number.isInteger(carId)) return null;

  // car_ids is stored as an array of strings, but Postgres JSONB containment
  // (.contains) is type-sensitive — a numeric probe like [5] never matches
  // a stored ["5"]. Fetch and compare with type coercion instead.
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, slug, name, car_ids");

  if (error) {
    console.error("getAssignedDealer:", error.message);
    return null;
  }

  const match = (data ?? []).find(
    (dealer) =>
      Array.isArray(dealer.car_ids) &&
      dealer.car_ids.map(Number).includes(carId),
  );

  return match ? { id: match.id, slug: match.slug, name: match.name } : null;
}

export default async function AdminEditCarPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "superadmin") {
    redirect("/backoffice-login");
  }

  const [dealers, car, assignedDealer] = await Promise.all([
    getDealers(),
    getCar(id),
    getAssignedDealer(id),
  ]);

  if (!car) {
    notFound();
  }

  const existingCar = {
    ...car,
    dealer_id: assignedDealer?.id ?? null,
    dealer_slug: assignedDealer?.slug ?? null,
  };

  return (
    <CarForm
      role="admin"
      dealers={dealers}
      existing={existingCar}
      backHref="/admin/cars"
    />
  );
}
