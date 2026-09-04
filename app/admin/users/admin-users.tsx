"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  BadgeCheck,
  Download,
  Mail,
  Phone,
  Search,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/Pagination";

export interface AppUser {
  id: number;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  provider: string | null;
  phone: string | null;
  phone_verified: boolean | null;
  role: string | null;
  gender: string | null;
  age_group: string | null;
  date_of_birth: string | null;
  area: string | null;
  housing_type: string | null;
  country: string | null;
  credits: number | null;
  created_at: string;
  updated_at: string | null;
}

interface Props {
  users: AppUser[];
  total: number;
  page: number;
  limit: number;
  search: string;
  provider: string;
  role: string;
}

const PROVIDERS = [
  { value: "", label: "All providers" },
  { value: "google", label: "Google" },
  { value: "credentials", label: "Email & password" },
];

const ROLES = [
  { value: "", label: "All roles" },
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

function initials(user: AppUser) {
  const source = user.name?.trim() || user.email?.trim() || "?";
  return source.charAt(0).toUpperCase();
}

function formatDate(value: string | null, pattern = "d MMM yyyy") {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : format(date, pattern);
}

/** Blank strings are stored alongside NULLs in this table — treat both as empty. */
function orDash(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const text = String(value).trim();
  return text === "" ? "—" : text;
}

export default function AdminUsersClient({
  users,
  total,
  page,
  limit,
  search,
  provider,
  role,
}: Props) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(search);
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<AppUser | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (provider) params.set("provider", provider);
    if (role) params.set("role", role);
    return params.toString();
  }, [search, provider, role]);

  /** Navigate with one filter changed; any filter change resets to page 1. */
  function applyFilters(next: Partial<Record<"q" | "provider" | "role", string>>) {
    const params = new URLSearchParams(queryString);
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `/admin/users?${qs}` : "/admin/users");
  }

  // Debounce the search box, then push it into the URL for a server-side query.
  useEffect(() => {
    if (searchInput === search) return;
    const timer = setTimeout(() => applyFilters({ q: searchInput }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(queryString);
    params.set("page", String(nextPage));
    router.push(`/admin/users?${params.toString()}`);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(
        queryString
          ? `/api/admin/users/export?${queryString}`
          : "/api/admin/users/export",
      );
      if (!res.ok) return;
      const text = await res.text();
      const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `sgelectrik-users-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } finally {
      setExporting(false);
    }
  }

  const hasFilters = Boolean(search || provider || role);

  return (
    <div className="max-w-full mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Users</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {total} registered {total === 1 ? "user" : "users"} on
              sgelectrik.com
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting || total === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="pl-10 bg-white"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={provider}
          onChange={(e) => applyFilters({ provider: e.target.value })}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          {PROVIDERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => applyFilters({ role: e.target.value })}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        >
          {ROLES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/users")}
            className="text-slate-500"
          >
            Clear
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-sm overflow-hidden py-0">
        {users.length === 0 ? (
          <CardContent className="py-20 text-center text-slate-400">
            <UsersIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No users found</p>
            {hasFilters && (
              <p className="text-sm mt-1">Try a different search or filter</p>
            )}
          </CardContent>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelected(user)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                {user.avatar_url ? (
                  // Avatars come from arbitrary OAuth hosts (Google, etc.), so
                  // they bypass next/image's configured remote patterns.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {initials(user)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 text-sm">
                      {user.name?.trim() || "Unnamed user"}
                    </p>
                    {user.role && user.role !== "user" && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 font-medium">
                        {user.role}
                      </span>
                    )}
                    {user.phone_verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                        <BadgeCheck className="h-3 w-3" /> Phone verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 truncate">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {orDash(user.email)}
                    </span>
                    {user.phone?.trim() && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-slate-400 capitalize">
                    {orDash(user.provider)}
                  </span>
                  <span className="text-xs text-slate-400">
                    Joined {formatDate(user.created_at)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selected.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-sm font-bold text-white">
                      {initials(selected)}
                    </div>
                  )}
                  <span>{selected.name?.trim() || "Unnamed user"}</span>
                </DialogTitle>
              </DialogHeader>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mt-2">
                {[
                  ["User ID", String(selected.id)],
                  ["Email", orDash(selected.email)],
                  ["Phone", orDash(selected.phone)],
                  ["Phone verified", selected.phone_verified ? "Yes" : "No"],
                  ["Provider", orDash(selected.provider)],
                  ["Role", orDash(selected.role)],
                  ["Gender", orDash(selected.gender)],
                  ["Age group", orDash(selected.age_group)],
                  ["Date of birth", formatDate(selected.date_of_birth)],
                  ["Area", orDash(selected.area)],
                  ["Housing type", orDash(selected.housing_type)],
                  ["Country", orDash(selected.country)],
                  ["Credits", orDash(selected.credits)],
                  ["Joined", formatDate(selected.created_at, "d MMM yyyy, HH:mm")],
                  [
                    "Last updated",
                    formatDate(selected.updated_at, "d MMM yyyy, HH:mm"),
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs text-slate-400">{label}</dt>
                    <dd className="text-slate-800 break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
