"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tag,
  Plus,
  MapPin,
  Calendar,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Promotion } from "@/app/lib/promotion";

const PAGE_SIZE = 9; // cards per page (3×3 grid)
const PAGE_GROUP = 5; // how many page numbers to show at once
const SGT = "Asia/Singapore";

interface Props {
  initialPromotions: Promotion[];
  basePath: "/admin/promotions" | "/dealer/promotions";
}

function getEventStatus(
  startDate: string,
  endDate: string,
): "live" | "upcoming" | "ended" {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: SGT });
  if (today >= startDate && today <= endDate) return "live";
  if (today < startDate) return "upcoming";
  return "ended";
}

function formatDateRange(startDate: string, endDate: string) {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    timeZone: SGT,
  };
  const start = new Date(startDate).toLocaleDateString("en-SG", opts);
  if (startDate === endDate) return start;
  return `${start} – ${new Date(endDate).toLocaleDateString("en-SG", opts)}`;
}

export default function PromotionsClient({ initialPromotions, basePath }: Props) {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(promotions.length / PAGE_SIZE));

  const groupStart =
    Math.floor((currentPage - 1) / PAGE_GROUP) * PAGE_GROUP + 1;
  const groupEnd = Math.min(groupStart + PAGE_GROUP - 1, totalPages);
  const pageNumbers = Array.from(
    { length: groupEnd - groupStart + 1 },
    (_, i) => groupStart + i,
  );

  const paginatedPromotions = promotions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/promotions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      const updated = promotions.filter((p) => p.id !== id);
      setPromotions(updated);
      const newTotal = Math.max(1, Math.ceil(updated.length / PAGE_SIZE));
      if (currentPage > newTotal) setCurrentPage(newTotal);
      toast({
        title: "Promotion deleted",
        description: `${title} has been removed.`,
      });
      startTransition(() => router.refresh());
    } catch {
      toast({
        title: "Error",
        description: "Could not delete the promotion.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promotions</h1>
          <p className="text-slate-500 text-sm mt-1">
            Roadshows, test drives and dealer promotions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {promotions.length} total
          </Badge>
          <Link href={`${basePath}/new`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add promotion
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {promotions.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-20 text-center">
            <Tag className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No promotions yet</p>
            <p className="text-slate-400 text-sm mt-1 mb-4">
              Add a roadshow or promotion to get started.
            </p>
            <Link href={`${basePath}/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add promotion
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedPromotions.map((p) => {
              const eventStatus = getEventStatus(p.start_date, p.end_date);
              return (
                <Card key={p.id} className="border-0 shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {p.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatDateRange(p.start_date, p.end_date)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge
                          variant={p.status === "active" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {p.status}
                        </Badge>
                        {p.status === "active" && (
                          <Badge
                            variant="outline"
                            className={
                              eventStatus === "live"
                                ? "text-xs border-emerald-300 text-emerald-600"
                                : eventStatus === "upcoming"
                                  ? "text-xs border-blue-300 text-blue-600"
                                  : "text-xs border-slate-300 text-slate-400"
                            }
                          >
                            {eventStatus === "live"
                              ? "Live now"
                              : eventStatus === "upcoming"
                                ? "Upcoming"
                                : "Ended"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1.5">
                      {p.venue && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{p.venue}</span>
                        </div>
                      )}
                      {p.time_range && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {p.time_range}
                        </div>
                      )}
                      {p.dealers && (
                        <div className="text-xs text-slate-400">
                          Owner: {p.dealers.name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <Link href={`${basePath}/edit/${p.id}`}>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
                        disabled={deletingId === p.id}
                        onClick={() => handleDelete(p.id, p.title)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === p.id ? "Deleting…" : "Delete"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="gap-1 px-3"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>

              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className="w-9"
                >
                  {page}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="gap-1 px-3"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
