"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const PAGE_GROUP_SIZE = 5;

interface PaginationProps {
  page: number;
  totalPages: number;
  /**
   * Optional. If provided, called instead of pushing the URL directly —
   * useful when the page also needs to update local state (e.g. client-side
   * slicing). The component still keeps the ?page= param in sync via this
   * callback's caller.
   */
  onPageChange?: (page: number) => void;
  /** Query param name, defaults to "page" */
  paramName?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  paramName = "page",
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const groupIndex = Math.floor((page - 1) / PAGE_GROUP_SIZE);
  const start = groupIndex * PAGE_GROUP_SIZE + 1;
  const end = Math.min(start + PAGE_GROUP_SIZE - 1, totalPages);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  function goToPage(p: number) {
    if (p < 1 || p > totalPages || p === page) return;

    if (onPageChange) {
      onPageChange(p);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, String(p));
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex justify-center mt-16 pt-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
        >
          ← Previous
        </Button>

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

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
