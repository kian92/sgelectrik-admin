import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import { CarForm } from "@/app/(common)/CarForm";

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

export default async function AdminNewCarPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    redirect("/backoffice-login");
  }

  const dealers = await getDealers();

  return (
    <CarForm
      role="admin"
      dealers={dealers}
      backHref="/admin/cars"
    />
  );
}
