"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type DealerStatus = "pending" | "active" | "inactive";
type FilterStatus = "all" | "pending" | "active" | "inactive";

interface Dealer {
  id: number;
  slug: string;
  name: string;
  short_name?: string;
  email?: string;
  phone?: string;
  brands?: string[] | string;
  website?: string;
  area?: string;
  address?: string;
  status: DealerStatus;
  role: string;
  created_at: string;
}

// ── Config ─────────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  DealerStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },

  active: {
    label: "Active",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },

  inactive: {
    label: "Inactive",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
};
// label shown on filter pills
const FILTER_LABELS: Record<FilterStatus, string> = {
  all: "All",
  pending: "Pending",
  active: "Approved",
  inactive: "Rejected",
};

const FILTERS: FilterStatus[] = ["all", "pending", "active", "inactive"];

// ── Component ──────────────────────────────────────────────────────────────────
export default function AdminClaims() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/pending-dealers");
      const data = await res.json();
      setDealers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: number, status: DealerStatus) => {
    setUpdating(id);
    try {
      await fetch(`/api/pending-dealers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setUpdating(null);
    }
  };

  const deleteDealer = async (id: number) => {
    if (!confirm("Delete this dealer account permanently?")) return;
    await fetch(`/api/pending-dealers/${id}`, { method: "DELETE" });
    await load();
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered =
    filter === "all" ? dealers : dealers.filter((d) => d.status === filter);

  const counts: Record<FilterStatus, number> = {
    all: dealers.length,
    pending: dealers.filter((d) => d.status === "pending").length,
    active: dealers.filter((d) => d.status === "active").length,
    inactive: dealers.filter((d) => d.status === "inactive").length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dealer Claims</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage dealer accounts on the platform
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === f
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {FILTER_LABELS[f]} <span className="opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center text-slate-400">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No {FILTER_LABELS[filter].toLowerCase()} dealers</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((dealer) => {
            const {
              label,
              color,
              icon: StatusIcon,
            } = STATUS_CONFIG[dealer.status];
            const isExpanded = expanded === dealer.id;

            return (
              <Card
                key={dealer.id}
                className="border-0 shadow-sm overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Row */}
                  <div className="p-5 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-slate-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-semibold text-slate-900">
                          {dealer.name}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${color}`}
                        >
                          <StatusIcon className="h-3 w-3" /> {label}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">
                          {dealer.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                        {dealer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {dealer.email}
                          </span>
                        )}
                        {dealer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {dealer.phone}
                          </span>
                        )}
                        {dealer.area && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {dealer.area}
                          </span>
                        )}
                        <span>
                          {format(new Date(dealer.created_at), "d MMM yyyy")}
                        </span>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {dealer.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            disabled={updating === dealer.id}
                            onClick={() => updateStatus(dealer.id, "active")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 border-red-200 hover:bg-red-50"
                            disabled={updating === dealer.id}
                            onClick={() => updateStatus(dealer.id, "inactive")}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      <button
                        onClick={() =>
                          setExpanded(isExpanded ? null : dealer.id)
                        }
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-slate-100">
                      <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
                        {dealer.short_name && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">
                              Short Name
                            </p>
                            <p className="text-slate-800">
                              {dealer.short_name}
                            </p>
                          </div>
                        )}
                        {dealer.address && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">
                              Address
                            </p>
                            <p className="text-slate-800">{dealer.address}</p>
                          </div>
                        )}
                        {dealer.website && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">
                              Website
                            </p>
                            <a
                              href={dealer.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              <Globe className="h-3.5 w-3.5" /> {dealer.website}
                            </a>
                          </div>
                        )}
                        {dealer.brands && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">
                              Brands
                            </p>
                            <p className="text-slate-800">
                              {Array.isArray(dealer.brands)
                                ? dealer.brands.join(", ")
                                : dealer.brands}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Status actions */}
                      <div className="flex items-center gap-2 mt-4">
                        {dealer.status !== "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updating === dealer.id}
                            onClick={() => updateStatus(dealer.id, "pending")}
                          >
                            Set Pending
                          </Button>
                        )}
                        {dealer.status !== "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            disabled={updating === dealer.id}
                            onClick={() => updateStatus(dealer.id, "active")}
                          >
                            Approve
                          </Button>
                        )}
                        {dealer.status !== "inactive" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 border-red-200 hover:bg-red-50"
                            disabled={updating === dealer.id}
                            onClick={() => updateStatus(dealer.id, "inactive")}
                          >
                            Reject
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 ml-auto"
                          onClick={() => deleteDealer(dealer.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
