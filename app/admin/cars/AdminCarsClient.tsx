"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Car, Pencil, Plus, Star, Loader2 } from "lucide-react";
import { DeleteCarButton } from "@/app/dealer/cars/DeleteCarButton";

interface DealerOption {
  id: number;
  name: string;
  slug: string;
}

interface AdminCar {
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
  featured: boolean;
  dealerId: number | null;
  dealerName: string;
  dealerSlug: string;
}

interface Props {
  initialCars: AdminCar[];
  initialDealers: DealerOption[];
}

const PAGE_SIZE = 10;

export default function AdminCarsClient({
  initialCars,
  initialDealers,
}: Props) {
  const [search, setSearch] = useState("");
  const [dealerFilter, setDealerFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [cars, setCars] = useState(initialCars);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    setCars(initialCars);
  }, [initialCars]);

  async function handleToggleFeatured(car: AdminCar) {
    setTogglingId(car.id);
    try {
      await fetch(`/api/cars/${car.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !car.featured }),
      });
      setCars((prev) =>
        prev.map((c) => (c.id === car.id ? { ...c, featured: !car.featured } : c)),
      );
    } finally {
      setTogglingId(null);
    }
  }

  const filteredCars = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cars.filter((car) => {
      const matchesDealer =
        dealerFilter === "all" || String(car.dealerId) === dealerFilter;
      const matchesSearch =
        !query ||
        car.name.toLowerCase().includes(query) ||
        car.brand.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query) ||
        car.dealerName.toLowerCase().includes(query);
      return matchesDealer && matchesSearch;
    });
  }, [cars, search, dealerFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCars.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedCars = filteredCars.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cars</h1>
          <p className="text-slate-500 text-sm mt-1">
            View and manage all dealer car listings.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {filteredCars.length} total
          </Badge>
          <Link href="/admin/cars/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add car
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto] mb-6">
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by car, brand, model or dealer"
        />

        <select
          value={dealerFilter}
          onChange={(event) => {
            setDealerFilter(event.target.value);
            setPage(1);
          }}
          className="w-full md:w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
        >
          <option value="all">All dealers</option>
          {initialDealers.map((dealer) => (
            <option key={dealer.id} value={String(dealer.id)}>
              {dealer.name}
            </option>
          ))}
        </select>
      </div>

      {filteredCars.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center">
          <Car className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No car listings found</p>
          <p className="text-slate-400 text-sm mt-1">
            Adjust your search or add a new car listing.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Dealer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCars.map((car) => (
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
                      <div className="font-medium text-slate-900">{car.name}</div>
                      <div className="text-xs text-slate-400">
                        {car.brand} · {car.model}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-700">{car.dealerName}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {car.car_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={car.condition === "new" ? "default" : "outline"}
                        className="text-xs capitalize"
                      >
                        {car.condition}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{car.year ?? "—"}</TableCell>
                    <TableCell className="text-slate-600">
                      S${car.price_min.toLocaleString()}
                      {car.price_max !== car.price_min &&
                        ` – S$${car.price_max.toLocaleString()}`}
                    </TableCell>
                    <TableCell className="text-slate-600">{car.range_km} km</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleFeatured(car)}
                        disabled={togglingId === car.id}
                        title={car.featured ? "Unfeature" : "Feature this car"}
                        className="p-1 rounded hover:bg-slate-100 transition-colors disabled:opacity-40"
                      >
                        {togglingId === car.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : (
                          <Star
                            className={`h-4 w-4 ${car.featured ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                          />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild size="sm" variant="outline" className="gap-1 h-8">
                          <Link href={`/admin/cars/edit/${car.id}`}>
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

          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
            >
              Previous
            </Button>
            <div className="text-sm text-slate-600">
              Page {safePage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage === totalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
