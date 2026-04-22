"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  ArrowLeft,
  Phone,
  Mail,
  Car,
  FileText,
  Calendar,
  User,
  Star,
  Clock,
  Zap,
  DollarSign,
} from "lucide-react";

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

interface CarRec {
  carId: string;
  carName: string;
  rank: number;
  reasoning: string;
  monthlyEstimate: number;
  chargingStrategy: string;
  fitScore: number;
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

const QUIZ_LABELS: Record<string, string> = {
  budget: "Budget",
  dailyDistanceKm: "Daily distance",
  hasHomeCharging: "Home charging",
  carType: "Car type",
  priority: "Priority",
};

function formatQuizValue(key: string, value: unknown): string {
  if (key === "hasHomeCharging") return value ? "Yes" : "No";
  if (key === "budget") {
    const map: Record<string, string> = {
      under100k: "Under S$100k",
      under150k: "Under S$150k",
      under200k: "Under S$200k",
      above200k: "Above S$200k",
    };
    return map[String(value)] ?? String(value);
  }
  if (key === "dailyDistanceKm") {
    const map: Record<string, string> = {
      under50: "Under 50 km",
      "50to100": "50–100 km",
      above100: "Above 100 km",
    };
    return map[String(value)] ?? String(value);
  }
  if (key === "priority") {
    const map: Record<string, string> = {
      saveMoney: "Save money",
      performance: "Performance",
      range: "Long range",
      convenience: "Convenience",
    };
    return map[String(value)] ?? String(value);
  }
  return String(value);
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setLead(data);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-screen-md mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !lead) {
    return (
      <div className="max-w-screen-md mx-auto text-center py-20 text-slate-400">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium text-slate-700 mb-1">
          Lead not found
        </p>
        <p className="text-sm mb-6">This lead may have been deleted.</p>
        <Link href="/admin/leads">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Leads
          </Button>
        </Link>
      </div>
    );
  }

  const source = getSource(lead);
  let quizAnswers: Record<string, unknown> | null = null;
  let recommendations: CarRec[] = [];
  let aiSummary = "";

  try {
    if (lead.quiz_answers) quizAnswers = JSON.parse(lead.quiz_answers);
  } catch {}
  try {
    if (lead.recommendation_result) {
      const r = JSON.parse(lead.recommendation_result);
      recommendations = r.recommendations ?? [];
      aiSummary = r.summary ?? "";
    }
  } catch {}

  return (
    <div className="max-w-screen-md mx-auto">
      {/* Back + header */}
      <div className="mb-6">
        <Link href="/admin/leads">
          <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Leads
          </button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
            <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
              <Calendar className="h-3.5 w-3.5" />
              Submitted{" "}
              {format(new Date(lead.created_at), "d MMMM yyyy, h:mm a")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Contact info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" /> Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-sm">Email</span>
              </div>
              <a
                href={`mailto:${lead.email}`}
                className="text-sm font-medium text-emerald-600 hover:underline"
              >
                {lead.email}
              </a>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="text-sm">Phone</span>
              </div>
              <a
                href={`tel:${lead.phone}`}
                className="text-sm font-medium text-slate-900 hover:underline"
              >
                {lead.phone}
              </a>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-slate-600">
                <Car className="h-4 w-4 text-slate-400" />
                <span className="text-sm">Preferred car</span>
              </div>
              <span className="text-sm font-medium text-slate-900">
                {lead.preferred_car}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5 text-slate-600">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-sm">Source</span>
              </div>
              <span className="text-sm font-medium text-slate-900">
                {source}
              </span>
            </div>
            <div className="flex gap-3 pt-2">
              <a href={`tel:${lead.phone}`} className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <Phone className="h-4 w-4" /> Call
                </Button>
              </a>
              <a href={`mailto:${lead.email}`} className="flex-1">
                <Button className="w-full gap-2">
                  <Mail className="h-4 w-4" /> Email
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Quiz answers */}
        {quizAnswers && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-slate-400" /> Quiz Answers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-slate-100">
                {Object.entries(quizAnswers).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between py-2.5"
                  >
                    <span className="text-sm text-slate-500">
                      {QUIZ_LABELS[k] ?? k.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {formatQuizValue(k, v)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Star className="h-4 w-4 text-slate-400" /> AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {aiSummary && (
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 leading-relaxed">
                  {aiSummary}
                </p>
              )}
              {recommendations.map((rec) => (
                <div
                  key={rec.carId}
                  className="border border-slate-100 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {rec.rank}
                      </span>
                      <p className="font-semibold text-slate-900">
                        {rec.carName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm flex-shrink-0">
                      <span className="text-slate-500 flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        S${rec.monthlyEstimate.toLocaleString()}/mo
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {rec.fitScore}% fit
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {rec.reasoning}
                  </p>
                  {rec.chargingStrategy && (
                    <div className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Charging strategy
                      </p>
                      <p className="text-xs text-blue-600 leading-relaxed">
                        {rec.chargingStrategy}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
