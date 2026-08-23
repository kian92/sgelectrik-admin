"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car as CarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { FleetCarCard, type FleetCar } from "@/app/(common)/FleetCarCard";

const PAGE_SIZE = 9;
const PAGE_GROUP = 5;

interface Props {
  rentalCompanyId: number;
  companyName: string;
  initialFleet: FleetCar[];
}

export default function AdminFleetListClient({
  rentalCompanyId,
  companyName,
  initialFleet,
}: Props) {
  const router = useRouter();
  const [fleet, setFleet] = useState<FleetCar[]>(initialFleet);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(fleet.length / PAGE_SIZE));
  const groupStart =
    Math.floor((currentPage - 1) / PAGE_GROUP) * PAGE_GROUP + 1;
  const groupEnd = Math.min(groupStart + PAGE_GROUP - 1, totalPages);
  const pageNumbers = Array.from(
    { length: groupEnd - groupStart + 1 },
    (_, i) => groupStart + i,
  );
  const paginatedFleet = fleet.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function goToPage(page: number) {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }

  function handleDeleted(id: number) {
    const updated = fleet.filter((c) => c.id !== id);
    setFleet(updated);
    const newTotal = Math.max(1, Math.ceil(updated.length / PAGE_SIZE));
    if (currentPage > newTotal) setCurrentPage(newTotal);
    router.refresh();
  }

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-8">
        <Link href="/admin/rentals">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-500 hover:text-slate-700 -ml-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Rentals
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CarIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {companyName} · Fleet
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage this company&apos;s fleet
            </p>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                Fleet
              </h2>
              <Badge variant="secondary" className="text-xs">
                {fleet.length} total
              </Badge>
            </div>
            <Link href={`/admin/rentals/${rentalCompanyId}/fleet/new`}>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add car
              </Button>
            </Link>
          </div>

          {fleet.length === 0 ? (
            <div className="py-16 text-center">
              <CarIcon className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500 font-medium">No fleet cars yet</p>
              <p className="text-slate-400 text-sm mt-1 mb-4">
                Add the first car to get started.
              </p>
              <Link href={`/admin/rentals/${rentalCompanyId}/fleet/new`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Add car
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedFleet.map((car) => (
                  <FleetCarCard
                    key={car.id}
                    car={car}
                    onEdit={(c) =>
                      router.push(
                        `/admin/rentals/${rentalCompanyId}/fleet/edit/${c.id}`,
                      )
                    }
                    onDeleted={handleDeleted}
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
    </div>
  );
}
