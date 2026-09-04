import { supabaseServer } from "@/app/lib/supabase-server";
import AdminUsersClient from "./admin-users";

const LIMIT = 20;

const USER_COLUMNS =
  "id, name, email, avatar_url, provider, phone, phone_verified, role, gender, age_group, date_of_birth, area, housing_type, country, credits, created_at, updated_at";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    provider?: string;
    role?: string;
  }>;
}) {
  const params = await searchParams;

  const page = Math.max(1, Number(params.page || 1));
  const search = (params.q ?? "").trim();
  const provider = params.provider ?? "";
  const role = params.role ?? "";

  const from = (page - 1) * LIMIT;
  const to = from + LIMIT - 1;

  let query = supabaseServer
    .from("users")
    .select(USER_COLUMNS, { count: "exact" });

  if (search) {
    // Escape the PostgREST `or` separators so a stray comma or paren can't
    // break out of the filter expression.
    const term = search.replace(/[,()\\]/g, " ").trim();
    if (term) {
      query = query.or(
        `name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
      );
    }
  }
  if (provider) query = query.eq("provider", provider);
  if (role) query = query.eq("role", role);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) console.error("admin/users:", error.message);

  return (
    <AdminUsersClient
      key={`${page}-${search}-${provider}-${role}`}
      users={data ?? []}
      total={count ?? 0}
      page={page}
      limit={LIMIT}
      search={search}
      provider={provider}
      role={role}
    />
  );
}
