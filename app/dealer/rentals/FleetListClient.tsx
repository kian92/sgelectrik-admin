"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car as CarIcon, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { FleetCarCard, type FleetCar } from "@/app/(common)/FleetCarCard";

const PAGE_SIZE = 9;
const PAGE_GROUP = 5;

interface Props {
  rentalCompanyId: number;
  initialFleet: FleetCar[];
}

type StatusFilter = "all" | "published" | "draft";

export default function FleetListClient({ initialFleet }: Props) {
  const router = useRouter();
  const [fleet, setFleet] = useState<FleetCar[]>(initialFleet);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredFleet =
    statusFilter === "all"
      ? fleet
      : fleet.filter((c) =>
          statusFilter === "published"
            ? c.status === "published"
            : c.status !== "published",
        );

  const totalPages = Math.max(1, Math.ceil(filteredFleet.length / PAGE_SIZE));
  const groupStart =
    Math.floor((currentPage - 1) / PAGE_GROUP) * PAGE_GROUP + 1;
  const groupEnd = Math.min(groupStart + PAGE_GROUP - 1, totalPages);
  const pageNumbers = Array.from(
    { length: groupEnd - groupStart + 1 },
    (_, i) => groupStart + i,
  );
  const paginatedFleet = filteredFleet.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }

  function changeFilter(f: StatusFilter) {
    setStatusFilter(f);
    setCurrentPage(1);
  }

  function handleDeleted(id: number) {
    const updated = fleet.filter((c) => c.id !== id);
    setFleet(updated);
    const newTotal = Math.max(1, Math.ceil(updated.length / PAGE_SIZE));
    if (currentPage > newTotal) setCurrentPage(newTotal);
    router.refresh();
  }

  function handleStatusChange(updatedCar: FleetCar) {
    setFleet((prev) =>
      prev.map((c) => (c.id === updatedCar.id ? updatedCar : c)),
    );
    router.refresh();
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">Fleet</h2>
            <Badge variant="secondary" className="text-xs">
              {fleet.length} total
            </Badge>
          </div>
          <Link href="/dealer/rentals/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add car
            </Button>
          </Link>
        </div>

        {fleet.length > 0 && (
          <div className="mb-4 flex gap-1.5">
            {(["all", "published", "draft"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => changeFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                  statusFilter === f
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        {fleet.length === 0 ? (
          <div className="py-16 text-center">
            <CarIcon className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No fleet cars yet</p>
            <p className="text-slate-400 text-sm mt-1 mb-4">
              Add the first car to get started.
            </p>
            <Link href="/dealer/rentals/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add car
              </Button>
            </Link>
          </div>
        ) : filteredFleet.length === 0 ? (
          <div className="py-16 text-center">
            <CarIcon className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">
              No {statusFilter} cars
            </p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedFleet.map((car) => (
                <FleetCarCard
                  key={car.id}
                  car={car}
                  onEdit={(c) => router.push(`/dealer/rentals/edit/${c.id}`)}
                  onDeleted={handleDeleted}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>

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
      </CardContent>
    </Card>
  );
}
