// app/admin/commercial-evs/AdminCommercialEvsClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Plus } from "lucide-react";
import { CommercialEvCard } from "@/app/(common)/CommercialEVCard";
import type { CommercialEv } from "./page";

interface Props {
  initialEvs: CommercialEv[];
}

const LIMIT = 9; // 3×3 grid
const PAGE_GROUP_SIZE = 5;

function getPageGroup(current: number, total: number) {
  const groupIndex = Math.floor((current - 1) / PAGE_GROUP_SIZE);
  const start = groupIndex * PAGE_GROUP_SIZE + 1;
  const end = Math.min(start + PAGE_GROUP_SIZE - 1, total);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return { pages, start, end };
}

export default function AdminCommercialEvsClient({ initialEvs }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [evs, setEvs] = useState(initialEvs);
  const [page, setPage] = useState(
    Math.max(1, Number(searchParams.get("page") || 1)),
  );

  const totalPages = Math.ceil(evs.length / LIMIT);
  const paginated = evs.slice((page - 1) * LIMIT, page * LIMIT);
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
          <h1 className="text-2xl font-bold text-slate-900">Commercial EVs</h1>
          <p className="text-slate-500 text-sm mt-1">
            Electric vans, trucks, lorries and buses on SGElectrik
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {evs.length} total
          </Badge>
          <Link href="/admin/commercial-evs/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add commercial EV
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {evs.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-20 text-center">
            <Truck className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No commercial EVs yet</p>
            <p className="text-slate-400 text-sm mt-1 mb-4">
              Add the first commercial EV to get started.
            </p>
            <Link href="/admin/commercial-evs/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add commercial EV
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Grid */}
      {evs.length > 0 && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginated.map((ev) => (
              <CommercialEvCard
                key={ev.id}
                ev={ev}
                editHref={`/admin/commercial-evs/edit/${ev.id}`}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-16 pt-6">
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

                {/* Page numbers */}
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
          )}
        </>
      )}
    </div>
  );
}
