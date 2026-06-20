import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import { CarForm } from "@/app/(common)/CarForm";

interface Props {
  params: { id: string };
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
  const { data, error } = await supabaseServer
    .from("cars")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getCar:", error.message);
    return null;
  }

  return data;
}

async function getAssignedDealer(id: string) {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, slug, name")
    .contains("car_ids", JSON.stringify([id]))
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getAssignedDealer:", error.message);
    return null;
  }

  return data;
}

export default async function AdminEditCarPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    redirect("/backoffice-login");
  }

  const [dealers, car, assignedDealer] = await Promise.all([
    getDealers(),
    getCar(params.id),
    getAssignedDealer(params.id),
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
