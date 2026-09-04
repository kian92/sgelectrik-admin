import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";

const COLUMNS = [
  "id",
  "name",
  "email",
  "phone",
  "phone_verified",
  "provider",
  "role",
  "gender",
  "age_group",
  "date_of_birth",
  "area",
  "housing_type",
  "country",
  "credits",
  "created_at",
] as const;

function toCsvCell(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// GET /api/admin/users/export — CSV of all users matching the current filters.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "superadmin")
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("q") ?? "").replace(/[,()\\]/g, " ").trim();
  const provider = searchParams.get("provider");
  const role = searchParams.get("role");

  let query = supabaseServer.from("users").select(COLUMNS.join(","));
  if (search)
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  if (provider) query = query.eq("provider", provider);
  if (role) query = query.eq("role", role);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const csv = [
    COLUMNS.join(","),
    ...rows.map((row) => COLUMNS.map((col) => toCsvCell(row[col])).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": 'attachment; filename="users.csv"',
    },
  });
}
