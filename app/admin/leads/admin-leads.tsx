"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Search,
  Download,
  X,
  FileText,
  ChevronRight,
  ChevronDown,
  Car,
  ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { QUIZ_LABELS, formatQuizValue } from "@/app/lib/quiz-labels";

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

interface QuizRecommendation {
  rank: number;
  carId: string;
  carName: string;
  fitScore: number;
  reasoning: string;
}

interface QuizSubmission {
  id: number;
  user_id: string | null;
  session_id: string | null;
  source: string | null;
  vehicle_use: string | null;
  budget: string | null;
  daily_distance_km: string | null;
  has_home_charging: boolean | null;
  priority: string | null;
  commercial_use: string | null;
  load_requirement: string | null;
  recommendations: QuizRecommendation[] | null;
  fallback_used: boolean | null;
  submitted_at: string;
}

interface Props {
  initialLeads: Lead[];
  total: number;
  quizSubmissions: QuizSubmission[];
  quizTotal: number;
  page: number;
  quizPage: number;
  limit: number;
}

const QUIZ_SUBMISSION_FIELDS: Array<keyof QuizSubmission> = [
  "vehicle_use",
  "budget",
  "daily_distance_km",
  "has_home_charging",
  "priority",
  "commercial_use",
  "load_requirement",
];

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
  quizSubmissions,
  quizTotal,
  page,
  quizPage,
  limit,
}: Props) {
  const [search, setSearch] = useState("");
  const [quizSearch, setQuizSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null);
  const router = useRouter();

  const leads = initialLeads;
  const totalPages = Math.ceil(total / limit);
  const quizTotalPages = Math.ceil(quizTotal / limit);
  const goToPage = (p: number) => {
    router.push(`?page=${p}&quizPage=${quizPage}`);
  };
  const goToQuizPage = (p: number) => {
    router.push(`?page=${page}&quizPage=${p}`);
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

  const filteredQuizSubmissions = useMemo(() => {
    const q = quizSearch.toLowerCase();
    if (!q) return quizSubmissions;
    return quizSubmissions.filter((s) =>
      [s.vehicle_use, s.budget, s.priority, s.commercial_use, s.session_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [quizSubmissions, quizSearch]);

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
            {leads.length} total enquiries · {quizSubmissions.length} quiz
            submissions
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

      <Tabs defaultValue="leads">
        <TabsList className="mb-5">
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="quiz-submissions">Quiz Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
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
        </TabsContent>

        <TabsContent value="quiz-submissions">
          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={quizSearch}
              onChange={(e) => setQuizSearch(e.target.value)}
              placeholder="Search by vehicle use, budget, or priority…"
              className="pl-10 bg-white"
            />
            {quizSearch && (
              <button
                onClick={() => setQuizSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Card className="border-0 shadow-sm overflow-hidden">
            {filteredQuizSubmissions.length === 0 ? (
              <CardContent className="py-20 text-center text-slate-400">
                <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No quiz submissions found</p>
                {quizSearch && (
                  <p className="text-sm mt-1">Try a different search term</p>
                )}
              </CardContent>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredQuizSubmissions.map((submission) => {
                  const isExpanded = expandedQuizId === submission.id;
                  return (
                    <div key={submission.id}>
                      <button
                        onClick={() =>
                          setExpandedQuizId(isExpanded ? null : submission.id)
                        }
                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                          <ClipboardList className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-semibold text-slate-900 text-sm">
                              {formatQuizValue(
                                "vehicle_use",
                                submission.vehicle_use,
                              )}
                            </p>
                            {submission.fallback_used && (
                              <span className="text-[10px] uppercase tracking-wide bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                                Fallback
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-slate-500">
                              {submission.budget
                                ? formatQuizValue("budget", submission.budget)
                                : "No budget given"}
                            </span>
                            <span className="text-xs text-slate-400 hidden sm:block">
                              · {submission.source ?? "quiz"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-slate-400">
                            {format(
                              new Date(submission.submitted_at),
                              "d MMM yyyy",
                            )}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-slate-300 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 bg-slate-50/50">
                          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl bg-white px-4">
                            {QUIZ_SUBMISSION_FIELDS.filter(
                              (field) => submission[field] !== null,
                            ).map((field) => (
                              <div
                                key={field}
                                className="flex items-center justify-between py-2.5"
                              >
                                <span className="text-sm text-slate-500">
                                  {QUIZ_LABELS[field] ?? field}
                                </span>
                                <span className="text-sm font-medium text-slate-900">
                                  {formatQuizValue(field, submission[field])}
                                </span>
                              </div>
                            ))}
                          </div>

                          {submission.recommendations &&
                            submission.recommendations.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {submission.recommendations.map((rec) => (
                                  <div
                                    key={rec.carId}
                                    className="border border-slate-100 rounded-xl p-3 bg-white"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2.5">
                                        <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                                          {rec.rank}
                                        </span>
                                        <p className="font-medium text-slate-900 text-sm">
                                          {rec.carName}
                                        </p>
                                      </div>
                                      <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                        {rec.fitScore}% fit
                                      </span>
                                    </div>
                                    {rec.reasoning && (
                                      <p className="text-xs text-slate-600 leading-relaxed mt-2">
                                        {rec.reasoning}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {quizTotalPages > 1 && (
            <div className="mt-10 pt-6 border-t border-slate-200 flex justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToQuizPage(Math.max(1, quizPage - 1))}
                  disabled={quizPage === 1}
                >
                  ← Previous
                </Button>

                {Array.from({ length: quizTotalPages }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => goToQuizPage(p)}
                      className={`h-8 w-8 rounded-lg text-xs font-medium ${
                        quizPage === p
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
                  onClick={() =>
                    goToQuizPage(Math.min(quizTotalPages, quizPage + 1))
                  }
                  disabled={quizPage === quizTotalPages}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
