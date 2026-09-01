"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Car,
  Users,
  FileText,
  MessageCircle,
  ExternalLink,
  Mail,
  Phone,
} from "lucide-react";

interface DealerProfile {
  id: number;
  name: string;
  short_name: string;
  slug: string;
  car_ids: number[] | null;
  commercial_evs: { id: number; name: string }[] | null;
}

interface RecentLead {
  id: number;
  name: string;
  email: string;
  phone: string;
  preferred_car: string;
  created_at: string;
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

export default function AdminDealerAnalyticsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<DealerProfile | null>(null);
  const [analytics, setAnalytics] = useState<DealerAnalytics | null>(null);
  const [leadsThisMonth, setLeadsThisMonth] = useState<number | null>(null);
  const [recentLeads, setRecentLeads] = useState<RecentLead[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/backoffice-login");
    } else if (status === "authenticated" && session?.user?.role !== "superadmin") {
      router.push("/dealer/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "superadmin") return;

    async function load() {
      try {
        const [profileRes, analyticsRes, leadsRes] = await Promise.all([
          fetch(`/api/dealers/${params.id}`),
          fetch(`/api/dealers/${params.id}/analytics`),
          fetch(`/api/dealers/${params.id}/leads?limit=10`),
        ]);
        if (profileRes.ok) setProfile(await profileRes.json());
        if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          setLeadsThisMonth(leadsData.countThisMonth);
          setRecentLeads(leadsData.leads);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [status, session, params.id]);

  if (status === "loading" || status !== "authenticated" || session?.user?.role !== "superadmin") {
    return null;
  }

  const totalListings = (profile?.car_ids?.length ?? 0) + (profile?.commercial_evs?.length ?? 0);

  const statCards = [
    {
      label: "Active Listings",
      value: totalListings,
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
  ];

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/dealers"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dealers
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {loading ? <Skeleton className="h-8 w-48" /> : profile?.name ?? "Dealer Analytics"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">Dealer performance overview</p>
          </div>
          {profile?.slug && (
            <Link href={`${process.env.NEXT_PUBLIC_USER_URL}/dealers/${profile.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" /> View public profile
              </Button>
            </Link>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-2">
        Leads this month · Profile views, car listing views and WhatsApp clicks are from the last{" "}
        {analytics?.windowDays ?? 30} days · Favorited is all-time
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">{label}</span>
                <div className={`${bg} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-slate-900">{value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm mb-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent Leads</CardTitle>
          <p className="text-xs text-slate-400">Most recent leads assigned to this dealer</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : recentLeads?.length ? (
            <div className="space-y-2">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between gap-4 py-2 px-3 rounded-xl bg-slate-50 flex-wrap"
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
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <a
                      href={`mailto:${lead.email}`}
                      className="flex items-center gap-1 hover:text-slate-800"
                    >
                      <Mail className="h-3 w-3" /> {lead.email}
                    </a>
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center gap-1 hover:text-slate-800"
                    >
                      <Phone className="h-3 w-3" /> {lead.phone}
                    </a>
                    <span className="text-slate-400">
                      {new Date(lead.created_at).toLocaleDateString("en-SG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm py-4 text-center">No leads yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Views by Car</CardTitle>
          <p className="text-xs text-slate-400">
            Last {analytics?.windowDays ?? 30} days · sorted by most viewed
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
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
                      <td className="py-2 font-medium text-slate-700">{c.carName}</td>
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
            <p className="text-slate-400 text-sm py-4 text-center">No per-car activity yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
