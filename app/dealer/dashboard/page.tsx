"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDealerAuth } from "@/app/contexts/dealer-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Users, FileText, Building2, ExternalLink } from "lucide-react";

interface DealerProfile {
  id: number;
  name: string;
  short_name: string;
  brands: string[];
  car_ids: string[];
  area: string | null;
  showrooms: number;
  slug: string;
}

export default function DealerDashboard() {
  const { dealer } = useDealerAuth();
  const [profile, setProfile] = useState<DealerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dealer?.id) return;

    async function load() {
      try {
        const res = await fetch(`/api/dealers/${dealer!.id}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dealer?.id]);

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
                  {profile.brands.join(", ")} · {profile.area} ·{" "}
                  {profile.showrooms} showroom{profile.showrooms > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Link href={`/dealers/${profile.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2 bg-white">
                <ExternalLink className="h-3.5 w-3.5" /> View public profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Active Listings",
            value: profile?.car_ids.length ?? 0,
            icon: Car,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Leads this month",
            value: "—",
            icon: Users,
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            label: "Profile views",
            value: "—",
            icon: FileText,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
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
            ) : profile?.car_ids.length ? (
              <div className="space-y-2 mb-4">
                {profile.car_ids.map((id) => (
                  <div
                    key={id}
                    className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {id.replace(/-/g, " ")}
                      </span>
                    </div>
                    <Link
                      href={`/cars/${id}`}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm py-4 text-center">
                No listings yet
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              disabled
            >
              <Car className="h-3.5 w-3.5" /> Add listing — coming soon
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Recent Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-slate-400">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Lead management coming soon</p>
              <p className="text-xs mt-1">
                You'll be able to view and respond to leads here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
