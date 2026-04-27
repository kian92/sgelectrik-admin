"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  Plus,
  MapPin,
  Star,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Workshop } from "@/app/lib/workshop";

const PAGE_SIZE = 9; // cards per page (3×3 grid)
const PAGE_GROUP = 5; // how many page numbers to show at once

interface Props {
  initialWorkshops: Workshop[];
}

export default function WorkshopsClient({ initialWorkshops }: Props) {
  const router = useRouter();
  const [workshops, setWorkshops] = useState<Workshop[]>(initialWorkshops);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(workshops.length / PAGE_SIZE));

  // Which group of 5 are we in? e.g. page 6 → groupStart = 6
  const groupStart =
    Math.floor((currentPage - 1) / PAGE_GROUP) * PAGE_GROUP + 1;
  const groupEnd = Math.min(groupStart + PAGE_GROUP - 1, totalPages);
  const pageNumbers = Array.from(
    { length: groupEnd - groupStart + 1 },
    (_, i) => groupStart + i,
  );

  const paginatedWorkshops = workshops.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/workshops/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      const updated = workshops.filter((w) => w.id !== id);
      setWorkshops(updated);
      // If deleting the last item on a page, go back one page
      const newTotal = Math.max(1, Math.ceil(updated.length / PAGE_SIZE));
      if (currentPage > newTotal) setCurrentPage(newTotal);
      toast({
        title: "Workshop deleted",
        description: `${name} has been removed.`,
      });
      startTransition(() => router.refresh());
    } catch {
      toast({
        title: "Error",
        description: "Could not delete the workshop.",
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
          <h1 className="text-2xl font-bold text-slate-900">Workshops</h1>
          <p className="text-slate-500 text-sm mt-1">
            All EV workshops on the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {workshops.length} total
          </Badge>
          <Link href="/dealer/workshops/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add workshop
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {workshops.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-20 text-center">
            <Wrench className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No workshops yet</p>
            <p className="text-slate-400 text-sm mt-1 mb-4">
              Add the first workshop to get started.
            </p>
            <Link href="/dealer/workshops/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add workshop
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedWorkshops.map((w) => (
              <Card key={w.id} className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {w.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{w.type}</p>
                    </div>
                    <Badge
                      variant={w.status === "active" ? "default" : "secondary"}
                      className="text-xs shrink-0"
                    >
                      {w.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1.5">
                    {w.area && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />{" "}
                        {w.area}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      {Number(w.rating).toFixed(1)}{" "}
                      <span className="text-slate-400">({w.review_count})</span>
                    </div>
                    {w.dealers && (
                      <div className="text-xs text-slate-400">
                        Owner: {w.dealers.name}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Link href={`/dealer/workshops/edit/${w.id}`}>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
                      disabled={deletingId === w.id}
                      onClick={() => handleDelete(w.id, w.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingId === w.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)} // ← was groupStart - 1
                disabled={currentPage === 1} // ← was groupStart === 1
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
                onClick={() => goToPage(currentPage + 1)} // ← was groupEnd + 1
                disabled={currentPage === totalPages} // ← was groupEnd === totalPages
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
