"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Plus, MapPin, Star, Pencil, Trash2 } from "lucide-react";
import type { RentalCompany } from "./page";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  initialCompanies: RentalCompany[];
  dealerId: number;
}

export default function DealerRentalsClient({
  initialCompanies,
  dealerId,
}: Props) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPage = Number(searchParams.get("page") || 1);

  const [page, setPage] = useState(initialPage);
  const limit = 6; // cards per page
  const PAGE_GROUP_SIZE = 6;

  const total = companies.length;
  const totalPages = Math.ceil(total / limit);

  const paginated = companies.slice((page - 1) * limit, page * limit);

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete ${name}?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/rental-companies/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert("Failed to delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }
  function getPageGroup(current: number, total: number) {
    const groupIndex = Math.floor((current - 1) / PAGE_GROUP_SIZE);

    const start = groupIndex * PAGE_GROUP_SIZE + 1;
    const end = Math.min(start + PAGE_GROUP_SIZE - 1, total);

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return { pages, start, end };
  }

  const { pages } = getPageGroup(page, totalPages);
  const goToPage = (p: number) => {
    setPage(p);
    router.push(`?page=${p}`, { scroll: false });
  };

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My EV Rentals</h1>
          <p className="text-slate-500 text-sm mt-1">
            Rental companies you manage on SGElectrik
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {companies.length} compan{companies.length === 1 ? "y" : "ies"}
          </Badge>
          <Link href="/dealer/rentals/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add company
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {companies.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-20 text-center">
            <Car className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">
              No rental companies yet
            </p>
            <p className="text-slate-400 text-sm mt-1 mb-4">
              List your fleet so customers can find and rent EVs.
            </p>
            <Link href="/dealer/rentals/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add company
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      {companies.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.map((c) => (
            <Card key={c.id} className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {c.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.type}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {c.fleet?.length ?? 0} cars
                  </Badge>
                </div>

                <div className="text-sm text-slate-600 space-y-1.5">
                  {c.area && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" /> {c.area}
                    </div>
                  )}
                  {c.priceFrom && (
                    <div className="text-emerald-600 font-medium">
                      From {c.priceFrom}
                      {c.pricePeriod}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    {c.rating}{" "}
                    <span className="text-slate-400">({c.reviewCount})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Link href={`/dealer/rentals/edit/${c.id}`}>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={deletingId === c.id}
                    onClick={() => handleDelete(c.id, c.name)}
                    className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === c.id ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="flex justify-center mt-16 pt-6 ">
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
