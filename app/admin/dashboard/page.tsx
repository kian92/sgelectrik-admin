"use client";

import { useEffect, useState } from "react";
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

interface Stats {
  totalLeads: number;
  uniqueUsers: number;
  approvedDealers: number;
  pendingClaims: number;
  recentLeads: Array<{
    id: number;
    name: string;
    preferred_car: string;
    created_at: string;
  }>;
  topCars: Array<{ car: string; count: number }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [leadsRes, claimsRes] = await Promise.all([
          fetch("/api/leads"),
          fetch("/api/dealer-claims"),
        ]);

        const leads: Array<{
          id: number;
          name: string;
          email: string;
          preferred_car: string;
          created_at: string;
        }> = await leadsRes.json();
        const claims: Array<{ status: string }> = await claimsRes.json();

        // Unique users by email
        const uniqueUsers = new Set(leads.map((l) => l.email)).size;

        // Claims stats
        const approvedDealers = claims.filter(
          (c) => c.status === "approved",
        ).length;
        const pendingClaims = claims.filter(
          (c) => c.status === "pending",
        ).length;

        // Top cars
        const carCount: Record<string, number> = {};
        for (const lead of leads) {
          carCount[lead.preferred_car] =
            (carCount[lead.preferred_car] ?? 0) + 1;
        }
        const topCars = Object.entries(carCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([car, count]) => ({ car, count }));

        // Recent 5 leads
        const recentLeads = [...leads]
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .slice(0, 5);

        setStats({
          totalLeads: leads.length,
          uniqueUsers,
          approvedDealers,
          pendingClaims,
          recentLeads,
          topCars,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    {
      label: "Total Enquiries",
      value: stats?.totalLeads ?? 0,
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Unique Users",
      value: stats?.uniqueUsers ?? 0,
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
              ) : stats?.recentLeads.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">
                  No enquiries yet
                </p>
              ) : (
                <div className="space-y-2">
                  {stats?.recentLeads.map((lead) => (
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
              ) : stats?.topCars.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">
                  No data yet
                </p>
              ) : (
                <div className="space-y-3">
                  {stats?.topCars.map((item, i) => (
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
