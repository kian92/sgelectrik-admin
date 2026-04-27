"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Phone,
  Mail,
  Car,
  ChevronDown,
  ChevronUp,
  Calendar,
  Building2,
  Sparkles,
} from "lucide-react";
import type { Lead, Dealer } from "./page";
import BackofficeLayout from "@/app/backoffice-layout";
import { useRouter, useSearchParams } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────

interface Rec {
  rank: number;
  carId: string;
  carName: string;
  fitScore: number;
  reasoning: string;
}

interface Props {
  dealer: Dealer;
  initialLeads: Lead[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseRecs(recommendationResult: string | null): Rec[] {
  if (!recommendationResult) return [];
  try {
    return JSON.parse(recommendationResult)?.recommendations ?? [];
  } catch {
    return [];
  }
}

// ── Lead row ─────────────────────────────────────────────────────────────────

function LeadRow({
  lead,
  dealerCarIds,
  dealerName,
}: {
  lead: Lead;
  dealerCarIds: string[];
  dealerName: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const recs = parseRecs(lead.recommendation_result);
  const matchedCars = recs.filter((r) =>
    dealerCarIds.map(String).includes(String(r.carId)),
  );
  const topRec = recs[0] ?? null;

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-start gap-4 p-5">
          {/* Avatar */}
          <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-emerald-700 text-sm font-bold">
              {lead.name.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + badge */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-slate-900">{lead.name}</span>
              {matchedCars.length > 0 && (
                <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                  Interested in your cars
                </Badge>
              )}
            </div>

            {/* Contact */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mb-2">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {lead.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {lead.phone}
              </span>
            </div>

            {/* Source row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 items-center">
              {topRec && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  AI recommended{" "}
                  <span className="font-medium text-slate-700">
                    {topRec.carName}
                  </span>
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Car className="h-3.5 w-3.5" />
                Preferred:{" "}
                <span className="font-medium text-slate-700">
                  {lead.preferred_car}
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(lead.created_at).toLocaleDateString("en-SG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            {/* Source dealer pill */}
            <div className="mt-2 inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-xs rounded-full px-3 py-1">
              <Building2 className="h-3 w-3" />
              Source: {dealerName}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:text-slate-700 gap-1 flex-shrink-0"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {expanded ? "Less" : "Details"}
          </Button>
        </div>

        {/* Expanded: AI recs + actions */}
        {expanded && (
          <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/60 rounded-b-xl">
            {recs.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  AI Recommendations
                </p>
                <div className="space-y-3">
                  {recs.map((rec, i) => {
                    const isYours = dealerCarIds
                      .map(String)
                      .includes(String(rec.carId));
                    return (
                      <div
                        key={i}
                        className={`rounded-xl p-3 border ${
                          isYours
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-slate-400">
                            #{rec.rank}
                          </span>
                          <span className="font-semibold text-sm text-slate-900">
                            {rec.carName}
                          </span>
                          {isYours && (
                            <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                              Your car
                            </Badge>
                          )}
                          <span className="ml-auto text-xs text-slate-500">
                            {rec.fitScore}% fit
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {rec.reasoning}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <a href={`mailto:${lead.email}`}>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <Mail className="h-3.5 w-3.5" /> Email lead
                </Button>
              </a>
              <a href={`tel:${lead.phone}`}>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <Phone className="h-3.5 w-3.5" /> Call lead
                </Button>
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main client component ─────────────────────────────────────────────────────

export default function DealerLeadsClient({ dealer, initialLeads }: Props) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPage = Number(searchParams.get("page") || 1);

  const [page, setPage] = useState(initialPage);
  const limit = 6;
  const PAGE_GROUP_SIZE = 5;

  const dealerCarIds = useMemo(
    () => (dealer.car_ids ?? []).map(String),
    [dealer.car_ids],
  );
  useEffect(() => {
    const p = Number(searchParams.get("page") || 1);
    setPage(p);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return initialLeads;
    return initialLeads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.preferred_car.toLowerCase().includes(q),
    );
  }, [initialLeads, search]);
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  // Split into "recommended your cars" vs "other"
  const paginatedRelevant = paginated.filter((lead) => {
    const recs = parseRecs(lead.recommendation_result);
    return recs.some((r) => dealerCarIds.includes(String(r.carId)));
  });

  const paginatedOther = paginated.filter(
    (lead) => !paginatedRelevant.includes(lead),
  );
  function getPageGroup(current: number, total: number) {
    const groupIndex = Math.floor((current - 1) / PAGE_GROUP_SIZE);

    const start = groupIndex * PAGE_GROUP_SIZE + 1;
    const end = Math.min(start + PAGE_GROUP_SIZE - 1, total);

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return { pages };
  }

  const relevantAll = filtered.filter((lead) => {
    const recs = parseRecs(lead.recommendation_result);
    return recs.some((r) => dealerCarIds.includes(String(r.carId)));
  });

  const otherAll = filtered.filter((lead) => !relevantAll.includes(lead));

  const { pages } = getPageGroup(page, totalPages);
  const goToPage = (p: number) => {
    setPage(p);
    router.push(`?page=${p}`, { scroll: false });
  };

  const displayName = dealer.short_name ?? dealer.name;

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Leads</h1>
          <p className="text-slate-500 text-sm mt-1">
            Buyers who've completed the AI quiz and been matched to{" "}
            {displayName}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {relevantAll.length} matched · {otherAll.length} other
        </Badge>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          className="pl-9"
          placeholder="Search by name, email or car..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-20 text-center">
            <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No leads found</p>
            <p className="text-slate-400 text-sm mt-1">
              Leads appear here when buyers complete the AI quiz.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lead groups */}
      {filtered.length > 0 && (
        <div className="space-y-6">
          {relevantAll.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Recommended your cars ({relevantAll.length})
              </p>
              <div className="space-y-3">
                {paginatedRelevant.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    dealerCarIds={dealerCarIds}
                    dealerName={displayName}
                  />
                ))}
              </div>
            </div>
          )}
          {otherAll.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Other leads ({otherAll.length})
              </p>
              <div className="space-y-3">
                {paginatedOther.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    dealerCarIds={dealerCarIds}
                    dealerName={displayName}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-center mt-10 pt-6 border-t border-slate-200">
        <div className="flex items-center gap-2">
          {/* Previous */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            ← Previous
          </Button>

          {/* Pages */}
          <div className="flex gap-1">
            {pages.map((p) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`h-8 w-8 rounded-lg text-xs font-medium ${
                  page === p
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Next */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}
