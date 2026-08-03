"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useDealerAuth } from "@/app/contexts/dealer-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Users, FileText, Building2, ExternalLink, MessageCircle, Truck, Settings } from "lucide-react";

interface DealerCar {
  id: number;
  name: string;
}

interface DealerProfile {
  id: number;
  name: string;
  short_name: string;
  brands: string[] | null;
  car_ids: number[] | null;
  cars: DealerCar[] | null;
  commercial_evs: DealerCar[] | null;
  area: string | null;
  showrooms: number;
  slug: string;
}

interface CarAnalytics {
  carId: number;
  carName: string;
  car_view: number;
  car_favorited: number;
  whatsapp_click: number;
  get_deal_click: number;
}

interface DealerAnalytics {
  windowDays: number;
  car_view: number;
  car_favorited: number;
  whatsapp_click: number;
  get_deal_click: number;
  dealer_view: number;
  perCar: CarAnalytics[];
}

interface RecentLead {
  id: number;
  name: string;
  preferred_car: string;
  created_at: string;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function DealerDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { dealer, loading: dealerLoading } = useDealerAuth();
  const [profile, setProfile] = useState<DealerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<DealerAnalytics | null>(null);
  const [recentLeads, setRecentLeads] = useState<RecentLead[] | null>(null);
  const [leadsThisMonth, setLeadsThisMonth] = useState<number | null>(null);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/backoffice-login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!dealer?.id || dealerLoading) return;

    async function load() {
      try {
        const [profileRes, analyticsRes, leadsRes] = await Promise.all([
          fetch(`/api/dealers/${dealer!.id}`),
          fetch(`/api/dealers/${dealer!.id}/analytics`),
          fetch(`/api/dealers/${dealer!.id}/leads?limit=5`),
        ]);
        if (profileRes.ok) setProfile(await profileRes.json());
        if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          setRecentLeads(leadsData.leads);
          setLeadsThisMonth(leadsData.countThisMonth);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dealer?.id, dealerLoading]);

  // Show loading while checking session and dealer
  if (status === "loading" || dealerLoading) {
    return (
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Loading...</h1>
          <p className="text-slate-500 text-sm mt-1">
            Preparing your dashboard
          </p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users
  if (status !== "authenticated" || !dealer) {
    return null;
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {dealer?.name}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {dealer?.area ?? dealer?.email} · Dealer Portal
        </p>
      </div>

      {/* Dealer profile card */}
      {profile && (
        <Card className="border-0 shadow-sm mb-6 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <Building2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{profile.name}</p>
                <p className="text-sm text-slate-600">
                  {(profile.brands ?? []).join(", ")} · {profile.area} ·{" "}
                  {profile.showrooms} showroom{profile.showrooms > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dealer/settings">
                <Button variant="outline" size="sm" className="gap-2 bg-white">
                  <Settings className="h-3.5 w-3.5" /> Edit profile
                </Button>
              </Link>
              <Link
                href={`${process.env.NEXT_PUBLIC_USER_URL}/dealers/${profile.slug}`}
                target="_blank"
              >
                <Button variant="outline" size="sm" className="gap-2 bg-white">
                  <ExternalLink className="h-3.5 w-3.5" /> View public profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <p className="text-xs text-slate-400 mb-2">
        Leads this month · Profile views, car listing views and WhatsApp clicks are from the last {analytics?.windowDays ?? 30} days · Favorited is all-time
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {[
          {
            label: "Active Listings",
            value: (profile?.car_ids?.length ?? 0) + (profile?.commercial_evs?.length ?? 0),
            caption: profile
              ? `${profile.car_ids?.length ?? 0} cars · ${profile.commercial_evs?.length ?? 0} commercial EVs`
              : undefined,
            icon: Car,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Leads this month",
            value: leadsThisMonth ?? "—",
            icon: Users,
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            label: "Profile views",
            value: analytics?.dealer_view ?? "—",
            icon: FileText,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Car listing views",
            value: analytics?.car_view ?? "—",
            icon: Car,
            color: "text-cyan-600",
            bg: "bg-cyan-50",
          },
          {
            label: "WhatsApp clicks",
            value: analytics?.whatsapp_click ?? "—",
            icon: MessageCircle,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Favorited",
            value: analytics?.car_favorited ?? "—",
            icon: Users,
            color: "text-rose-600",
            bg: "bg-rose-50",
          },
        ].map(({ label, value, caption, icon: Icon, color, bg }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">
                  {label}
                </span>
                <div className={`${bg} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900">{value}</div>
              {caption && (
                <p className="text-xs text-slate-400 mt-1">{caption}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Listings + leads */}
      <div className="grid sm:grid-cols-2 gap-5">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Your Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400 text-sm py-4 text-center">
                Loading...
              </p>
            ) : (profile?.car_ids?.length || profile?.commercial_evs?.length) ? (
              <div className="space-y-2 mb-4">
                {(profile.car_ids ?? []).map((id) => {
                  const car = profile.cars?.find((c) => c.id === id);
                  const publicHref = car
                    ? `${process.env.NEXT_PUBLIC_USER_URL}/cars/${id}/${slugify(car.name)}`
                    : null;
                  return (
                    <div
                      key={`car-${id}`}
                      className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {car?.name ?? `Car #${id}`}
                        </span>
                      </div>
                      {publicHref ? (
                        <Link
                          href={publicHref}
                          target="_blank"
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          View
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-300">Unavailable</span>
                      )}
                    </div>
                  );
                })}
                {(profile.commercial_evs ?? []).map((ev) => {
                  const publicHref = `${process.env.NEXT_PUBLIC_USER_URL}/commercial-evs/${ev.id}/${slugify(ev.name)}`;
                  return (
                    <div
                      key={`ev-${ev.id}`}
                      className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {ev.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          Commercial
                        </span>
                      </div>
                      <Link
                        href={publicHref}
                        target="_blank"
                        className="text-xs text-emerald-600 hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 text-sm py-4 text-center">
                No listings yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Recent Leads
            </CardTitle>
            <Link href="/dealer/leads" className="text-xs text-emerald-600 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400 text-sm py-4 text-center">
                Loading...
              </p>
            ) : recentLeads?.length ? (
              <div className="space-y-2">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {lead.name}
                      </span>
                      <span className="text-xs text-slate-400 truncate">
                        · {lead.preferred_car}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No leads yet</p>
                <p className="text-xs mt-1">
                  New leads for your listings will show up here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-car breakdown */}
      <Card className="border-0 shadow-sm mt-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Views by Car
          </CardTitle>
          <p className="text-xs text-slate-400">
            Last {analytics?.windowDays ?? 30} days · sorted by most viewed
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-400 text-sm py-4 text-center">
              Loading...
            </p>
          ) : analytics?.perCar?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                    <th className="pb-2 font-medium">Car</th>
                    <th className="pb-2 font-medium text-right">Views</th>
                    <th className="pb-2 font-medium text-right">Favorited</th>
                    <th className="pb-2 font-medium text-right">WhatsApp</th>
                    <th className="pb-2 font-medium text-right">Get Deal</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.perCar.map((c) => (
                    <tr key={c.carId} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 font-medium text-slate-700">
                        {c.carName}
                      </td>
                      <td className="py-2 text-right text-slate-600">{c.car_view}</td>
                      <td className="py-2 text-right text-slate-600">{c.car_favorited}</td>
                      <td className="py-2 text-right text-slate-600">{c.whatsapp_click}</td>
                      <td className="py-2 text-right text-slate-600">{c.get_deal_click}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-4 text-center">
              No per-car activity yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
