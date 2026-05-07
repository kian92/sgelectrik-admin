import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { supabaseServer } from "@/app/lib/supabase-server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CommercialEvForm } from "@/app/(common)/CommercialForm";

type Params = { params: Promise<{ id: string }> };

async function getEv(id: number) {
  const { data } = await supabaseServer
    .from("commercial_evs")
    .select("*")
    .eq("id", id)
    .single();
  return data ?? null;
}

async function getDealers() {
  const { data } = await supabaseServer
    .from("dealers")
    .select("id, slug, name")
    .order("name", { ascending: true });
  return data ?? [];
}

export default async function EditCommercialEvPage({ params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/backoffice-login");

  const { id } = await params;
  const [ev, dealers] = await Promise.all([getEv(parseInt(id)), getDealers()]);
  if (!ev) notFound();

  return (
    <CommercialEvForm
      role="admin"
      existing={ev}
      dealers={dealers}
      backHref="/admin/commercial-evs"
    />
  );
}
