"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Building2,
  ClipboardList,
  TrendingUp,
  Car,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

interface DashboardStats {
  totalEnquiries: number;
  totalUsers: number;
  approvedDealers: number;
  pendingClaims: number;
  recentEnquiries: Array<{
    id: number;
    name: string;
    preferred_car: string;
    created_at: string;
  }>;
  topModels: Array<{ car: string; count: number }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication and authorization
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/backoffice-login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dealer/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "admin") return;

    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const data: DashboardStats = await res.json();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [status, session]);

  // Show loading skeleton while session is initializing
  if (status === "loading") {
    return (
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Overview of platform activity
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Redirect handled by useEffect — render nothing while redirecting
  if (status !== "authenticated" || session?.user?.role !== "admin") {
    return null;
  }

  const statCards = [
    {
      label: "Total Enquiries",
      value: stats?.totalEnquiries ?? 0,
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Approved Dealers",
      value: stats?.approvedDealers ?? 0,
      icon: Building2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Pending Claims",
      value: stats?.pendingClaims ?? 0,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Overview of platform activity
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
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
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-slate-900">{value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent enquiries + top models */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Enquiries */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-slate-400" /> Recent
                Enquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !stats?.recentEnquiries.length ? (
                <p className="text-slate-400 text-sm text-center py-6">
                  No enquiries yet
                </p>
              ) : (
                <div className="space-y-2">
                  {stats.recentEnquiries.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {lead.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {lead.preferred_car}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {format(new Date(lead.created_at), "d MMM")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Models */}
        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-400" /> Top Models
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !stats?.topModels.length ? (
                <p className="text-slate-400 text-sm text-center py-6">
                  No data yet
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.topModels.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Car className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">
                          {item.car}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
