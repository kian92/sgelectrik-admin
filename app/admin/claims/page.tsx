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
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type ClaimStatus = "pending" | "approved" | "rejected";

interface Claim {
  id: number;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  brands: string;
  website?: string;
  message?: string;
  status: ClaimStatus;
  admin_notes?: string;
  created_at: string;
}

const STATUS_CONFIG: Record<
  ClaimStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
};

const FILTERS: Array<ClaimStatus | "all"> = [
  "all",
  "pending",
  "approved",
  "rejected",
];

export default function AdminClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ClaimStatus | "all">("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/dealer-claims");
      const data = await res.json();
      setClaims(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: number, status: ClaimStatus) => {
    setUpdating(id);
    try {
      await fetch(`/api/dealer-claims/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setUpdating(null);
    }
  };

  const deleteClaim = async (id: number) => {
    if (!confirm("Delete this claim?")) return;
    await fetch(`/api/dealer-claims/${id}`, { method: "DELETE" });
    await load();
  };

  const filtered =
    filter === "all" ? claims : claims.filter((c) => c.status === filter);

  const counts = {
    all: claims.length,
    pending: claims.filter((c) => c.status === "pending").length,
    approved: claims.filter((c) => c.status === "approved").length,
    rejected: claims.filter((c) => c.status === "rejected").length,
  };

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dealer Claims</h1>
        <p className="text-slate-500 text-sm mt-1">
          Applications from companies wanting to join the platform
        </p>
      </div>

      {/* Filter tabs */}
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
            {f.charAt(0).toUpperCase() + f.slice(1)}{" "}
            <span className="opacity-60">({counts[f]})</span>
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
            <p>No {filter === "all" ? "" : filter} claims</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((claim) => {
            const {
              label,
              color,
              icon: StatusIcon,
            } = STATUS_CONFIG[claim.status];
            const isExpanded = expanded === claim.id;

            return (
              <Card
                key={claim.id}
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
                          {claim.company_name}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${color}`}
                        >
                          <StatusIcon className="h-3 w-3" /> {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {claim.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {claim.phone}
                        </span>
                        <span>Brands: {claim.brands}</span>
                        <span>
                          {format(new Date(claim.created_at), "d MMM yyyy")}
                        </span>
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {claim.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            disabled={updating === claim.id}
                            onClick={() => updateStatus(claim.id, "approved")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />{" "}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 border-red-200 hover:bg-red-50"
                            disabled={updating === claim.id}
                            onClick={() => updateStatus(claim.id, "rejected")}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      <button
                        onClick={() =>
                          setExpanded(isExpanded ? null : claim.id)
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
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">
                            Contact Person
                          </p>
                          <p className="text-slate-800">{claim.contact_name}</p>
                        </div>
                        {claim.website && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">
                              Website
                            </p>
                            <a
                              href={claim.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:underline flex items-center gap-1"
                            >
                              <Globe className="h-3.5 w-3.5" /> {claim.website}
                            </a>
                          </div>
                        )}
                        {claim.message && (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-medium text-slate-500 mb-1">
                              Message
                            </p>
                            <p className="text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                              {claim.message}
                            </p>
                          </div>
                        )}
                        {claim.admin_notes && (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-medium text-slate-500 mb-1">
                              Admin Notes
                            </p>
                            <p className="text-slate-700 bg-amber-50 rounded-lg px-3 py-2">
                              {claim.admin_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Status actions */}
                      <div className="flex items-center gap-2 mt-4">
                        {claim.status !== "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updating === claim.id}
                            onClick={() => updateStatus(claim.id, "pending")}
                          >
                            Set Pending
                          </Button>
                        )}
                        {claim.status !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            disabled={updating === claim.id}
                            onClick={() => updateStatus(claim.id, "approved")}
                          >
                            Approve
                          </Button>
                        )}
                        {claim.status !== "rejected" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 border-red-200 hover:bg-red-50"
                            disabled={updating === claim.id}
                            onClick={() => updateStatus(claim.id, "rejected")}
                          >
                            Reject
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 ml-auto"
                          onClick={() => deleteClaim(claim.id)}
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
