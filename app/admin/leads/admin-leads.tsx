"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Search, Download, X, FileText, ChevronRight, Car } from "lucide-react";
import { useRouter } from "next/navigation";

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  preferred_car: string;
  quiz_answers?: string;
  recommendation_result?: string;
  created_at: string;
}
interface Props {
  initialLeads: Lead[];
  total: number;
  page: number;
  limit: number;
}

function getSource(lead: Lead): string {
  if (!lead.recommendation_result) return "Direct enquiry";
  try {
    const r = JSON.parse(lead.recommendation_result);
    if (r?.source === "rental_enquiry") return `Rental — ${r.company}`;
    if (r?.source === "dealer_enquiry") return "Dealer page";
    return "AI Quiz";
  } catch {
    return "Direct enquiry";
  }
}

export default function AdminLeadsClient({
  initialLeads,
  total,
  page,
  limit,
}: Props) {
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const router = useRouter();

  const leads = initialLeads;
  const totalPages = Math.ceil(total / limit);
  const goToPage = (p: number) => {
    router.push(`?page=${p}`);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.preferred_car.toLowerCase().includes(q),
    );
  }, [leads, search]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/leads/export");
      const text = await response.text();
      const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `sgelectrik-leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-full mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500 text-sm mt-1">
            {leads.length} total enquiries
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
          className="gap-2"
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, or car…"
          className="pl-10 bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <CardContent className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        ) : filtered.length === 0 ? (
          <CardContent className="py-20 text-center text-slate-400">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No leads found</p>
            {search && (
              <p className="text-sm mt-1">Try a different search term</p>
            )}
          </CardContent>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((lead) => (
              <Link key={lead.id} href={`/admin/leads/${lead.id}`}>
                <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                    {lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">
                        {lead.name}
                      </p>
                      <span className="text-xs text-slate-500 hidden sm:block">
                        {lead.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Car className="h-3 w-3" /> {lead.preferred_car}
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:block">
                        · {getSource(lead)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-400">
                      {format(new Date(lead.created_at), "d MMM yyyy")}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
      <div className="mt-10 pt-6 border-t border-slate-200 flex justify-center">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            ← Previous
          </Button>

          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            return (
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
            );
          })}

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
