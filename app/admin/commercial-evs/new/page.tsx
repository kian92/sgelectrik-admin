import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { supabaseServer } from "@/app/lib/supabase-server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CommercialEvForm } from "@/app/(common)/CommercialForm";

async function getDealers() {
  const { data } = await supabaseServer
    .from("dealers")
    .select("id, slug, name")
    .order("name", { ascending: true });
  return data ?? [];
}

export default async function NewCommercialEvPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/backoffice-login");

  const dealers = await getDealers();

  return (
    <CommercialEvForm
      role="admin"
      dealers={dealers}
      backHref="/admin/commercial-evs"
    />
  );
}
