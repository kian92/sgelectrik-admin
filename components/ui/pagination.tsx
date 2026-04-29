// components/ui/pagination.tsx
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/app/lib/utils";

const WINDOW = 5; // pages visible at a time

function getPageWindow(current: number, total: number) {
  // Which block of 5 are we in? e.g. page 6 → block starting at 6
  const blockStart = Math.floor((current - 1) / WINDOW) * WINDOW + 1;
  const blockEnd = Math.min(blockStart + WINDOW - 1, total);

  const pages: number[] = [];
  for (let i = blockStart; i <= blockEnd; i++) pages.push(i);
  return { pages, blockStart, blockEnd };
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** base path – defaults to current path, appends ?page=N */
  basePath?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath = "",
}: PaginationProps) {
  const { pages, blockStart, blockEnd } = getPageWindow(
    currentPage,
    totalPages,
  );

  const href = (p: number) => `${basePath}?page=${p}`;

  // Prev goes to last page of previous block (or page 1)
  const prevPage =
    currentPage === blockStart
      ? Math.max(1, blockStart - 1) // jump to end of previous block
      : currentPage - 1;

  // Next goes to first page of next block (or last page)
  const nextPage =
    currentPage === blockEnd
      ? Math.min(totalPages, blockEnd + 1) // jump to start of next block
      : currentPage + 1;

  const isPrevDisabled = currentPage === 1;
  const isNextDisabled = currentPage === totalPages;

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      {/* Prev */}
      <PaginationLink
        href={href(prevPage)}
        disabled={isPrevDisabled}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only sm:ml-1 text-sm">Prev</span>
      </PaginationLink>

      {/* Page numbers */}
      {pages.map((p) => (
        <PaginationLink
          key={p}
          href={href(p)}
          active={p === currentPage}
          aria-label={`Page ${p}`}
          aria-current={p === currentPage ? "page" : undefined}
        >
          {p}
        </PaginationLink>
      ))}

      {/* Next */}
      <PaginationLink
        href={href(nextPage)}
        disabled={isNextDisabled}
        aria-label="Next page"
      >
        <span className="sr-only sm:not-sr-only sm:mr-1 text-sm">Next</span>
        <ChevronRight className="h-4 w-4" />
      </PaginationLink>
    </nav>
  );
}

// ─── internal link ────────────────────────────────────────────────────────────

interface PLProps {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
  "aria-current"?: "page" | undefined;
}

function PaginationLink({
  href,
  active,
  disabled,
  children,
  ...rest
}: PLProps) {
  const base =
    "inline-flex items-center justify-center rounded-md min-w-[2.25rem] h-9 px-2 text-sm font-medium transition-colors select-none";

  if (disabled) {
    return (
      <span
        className={cn(base, "text-slate-300 cursor-not-allowed")}
        aria-disabled="true"
        {...rest}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        base,
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
