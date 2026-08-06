"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Plus } from "lucide-react";
import { CommercialEvCard } from "@/app/(common)/CommercialEVCard";
import { Pagination } from "@/components/Pagination";
import type { CommercialEv } from "./page";

interface Props {
  initialEvs: CommercialEv[];
}

const LIMIT = 6; // 3×3 grid

export default function AdminCommercialEvsClient({ initialEvs }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [evs, setEvs] = useState(initialEvs);
  const [page, setPage] = useState(
    Math.max(1, Number(searchParams.get("page") || 1)),
  );
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(evs.length / LIMIT));
  const paginated = evs.slice((page - 1) * LIMIT, page * LIMIT);

  const goToPage = (p: number) => {
    setPage(p);
    router.push(`?page=${p}`, { scroll: false });
  };

  const handleDeleted = (id: number) => {
    const next = evs.filter((ev) => ev.id !== id);
    const nextPage = Math.min(
      page,
      Math.max(1, Math.ceil(next.length / LIMIT)),
    );
    setEvs(next);
    if (nextPage !== page) {
      setPage(nextPage);
      router.replace(`?page=${nextPage}`, { scroll: false });
    }
  };

  const handleToggleFeatured = async (ev: {
    id: number;
    featured?: boolean;
  }) => {
    setTogglingId(ev.id);
    try {
      await fetch(`/api/commercial-evs/${ev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !ev.featured }),
      });
      setEvs((prev) =>
        prev.map((e) =>
          e.id === ev.id ? { ...e, featured: !ev.featured } : e,
        ),
      );
    } finally {
      setTogglingId(null);
    }
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
                onDeleted={handleDeleted}
                onToggleFeatured={handleToggleFeatured}
                togglingFeatured={togglingId === ev.id}
              />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </>
      )}
    </div>
  );
}
