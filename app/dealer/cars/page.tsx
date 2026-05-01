import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/app/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Car, Plus, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { DeleteCarButton } from "./DeleteCarButton";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const PAGE_WINDOW = 5; // how many page numbers to show at once

// ─── Types ────────────────────────────────────────────────────────────────────

interface CarRow {
  id: string;
  name: string;
  brand: string;
  model: string;
  car_type: string;
  condition: string;
  year: number | null;
  price_min: number;
  price_max: number;
  range_km: number;
  image_url: string;
  created_at: string;
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getDealerByEmail(email: string) {
  const { data, error } = await supabaseServer
    .from("dealers")
    .select("id, slug, car_ids")
    .eq("email", email)
    .eq("role", "dealer")
    .maybeSingle();

  if (error) {
    console.error("getDealerByEmail:", error.message);
    return null;
  }

  return data;
}

async function getDealerCars(
  carIds: string[],
  page: number,
): Promise<{ cars: CarRow[]; total: number }> {
  if (!carIds.length) return { cars: [], total: 0 };

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabaseServer
    .from("cars")
    .select(
      "id, name, brand, model, car_type, condition, year, price_min, price_max, range_km, image_url, created_at",
      { count: "exact" },
    )
    .in("id", carIds)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("getDealerCars:", error.message);
    return { cars: [], total: 0 };
  }

  return { cars: data ?? [], total: count ?? 0 };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return `S$${n.toLocaleString()}`;
}

// Returns the first page of the current 5-page window.
// Example: page 1-5 → windowStart=1, page 6-10 → windowStart=6
function getWindowStart(currentPage: number, totalPages: number): number {
  const windowIndex = Math.floor((currentPage - 1) / PAGE_WINDOW);
  const start = windowIndex * PAGE_WINDOW + 1;
  return Math.min(start, Math.max(1, totalPages - PAGE_WINDOW + 1));
}

// ─── Pagination component ─────────────────────────────────────────────────────

function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const windowStart = getWindowStart(currentPage, totalPages);
  const windowEnd = Math.min(windowStart + PAGE_WINDOW - 1, totalPages);
  const pages = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i,
  );

  const isPrevDisabled = currentPage === 1;
  const isNextDisabled = currentPage === totalPages;

  // Prev: if on first page of the window, jump to last page of previous window
  // otherwise just go back one page
  const prevTarget =
    currentPage === windowStart && windowStart > 1
      ? windowStart - 1
      : Math.max(1, currentPage - 1);

  // Next: if on last page of the window, jump to first page of next window
  // otherwise just go forward one page
  const nextTarget =
    currentPage === windowEnd && windowEnd < totalPages
      ? windowEnd + 1
      : Math.min(totalPages, currentPage + 1);

  const linkBase =
    "inline-flex items-center justify-center h-9 rounded-md text-sm font-medium border transition-colors";
  const activeClass =
    "bg-emerald-600 text-white border-emerald-600 pointer-events-none w-9";
  const inactiveClass =
    "text-slate-600 border-slate-200 bg-white hover:bg-slate-50 w-9";
  const navClass =
    "gap-1 px-3 text-slate-600 border-slate-200 bg-white hover:bg-slate-50";
  const disabledClass =
    "gap-1 px-3 text-slate-300 border-slate-200 bg-white cursor-not-allowed select-none";

  return (
    <div className="flex items-center gap-1">
      {/* Prev */}
      {isPrevDisabled ? (
        <button disabled className={`${linkBase} ${disabledClass}`}>
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
      ) : (
        <Link
          href={`?page=${prevTarget}`}
          className={`${linkBase} ${navClass}`}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Link>
      )}

      {/* Page numbers */}
      {pages.map((p) => (
        <Link
          key={p}
          href={`?page=${p}`}
          className={`${linkBase} ${p === currentPage ? activeClass : inactiveClass}`}
        >
          {p}
        </Link>
      ))}

      {/* Next */}
      {isNextDisabled ? (
        <button disabled className={`${linkBase} ${disabledClass}`}>
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <Link
          href={`?page=${nextTarget}`}
          className={`${linkBase} ${navClass}`}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DealerCarsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const dealer = await getDealerByEmail(session.user.email);
  if (!dealer) redirect("/login");

  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1") || 1);

  const carIds: string[] = Array.isArray(dealer.car_ids) ? dealer.car_ids : [];
  const { cars, total } = await getDealerCars(carIds, currentPage);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  // Clamp so safePage is never beyond what exists
  const safePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Car className="h-6 w-6 text-emerald-600" />
            My Cars
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {total} listing{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dealer/cars/new">
            <Plus className="h-4 w-4" />
            Add car
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
          <Car className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No cars yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Add your first listing to get started.
          </p>
          <Button asChild className="mt-4 gap-2" size="sm">
            <Link href="/dealer/cars/new">
              <Plus className="h-4 w-4" />
              Add car
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cars.map((car) => (
                  <TableRow key={car.id} className="hover:bg-slate-50">
                    <TableCell>
                      {car.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={car.image_url}
                          alt={car.name}
                          className="h-10 w-14 rounded object-cover border border-slate-100"
                        />
                      ) : (
                        <div className="h-10 w-14 rounded bg-slate-100 flex items-center justify-center">
                          <Car className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {car.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {car.brand} · {car.model}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {car.car_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          car.condition === "new" ? "default" : "outline"
                        }
                        className="text-xs capitalize"
                      >
                        {car.condition}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {car.year ?? "—"}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {formatPrice(car.price_min)}
                      {car.price_max !== car.price_min &&
                        ` – ${formatPrice(car.price_max)}`}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {car.range_km} km
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="gap-1 h-8"
                        >
                          <Link href={`/dealer/cars/edit/${car.id}`}>
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Link>
                        </Button>
                        <DeleteCarButton carId={car.id} carName={car.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-center text-sm text-slate-500 px-1">
            <Pagination currentPage={safePage} totalPages={totalPages} />
          </div>
        </>
      )}
    </div>
  );
}
