"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Car,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface DealerListing {
  id: string;
  dealerSlug: string;
  brand: string;
  model: string;
  carType: string;
  condition: string;
  priceMin: number;
  priceMax: number;
  rangeKm: number;
  seats: number;
  topSpeed: number;
  acceleration: string;
  chargingTimeFast: string;
  chargingTimeSlow: string;
  rebateEligible: boolean;
  rebateAmount: number | null;
  highlights: string;
  description: string;
  monthlyEstimate: number;
  year: number | null;
  mileage: number | null;
  imageUrl: string | null;
  status: string;
  createdAt: string;
}

interface Props {
  dealer: { id: number; slug: string; name: string };
  initialListings: DealerListing[];
}

export function DealerListingsClient({ dealer, initialListings }: Props) {
  const [listings, setListings] = useState<DealerListing[]>(initialListings);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Remove ${label}?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/dealer-listings/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Listing removed" });
    } catch {
      toast({ title: "Failed to remove listing", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const totalCount = listings.length;

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Listings</h1>
          <p className="text-slate-500 text-sm mt-1">
            {dealer.name} · Manage your vehicle listings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {totalCount} listing{totalCount !== 1 ? "s" : ""}
          </Badge>
          <Link href="/dealer/listings/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add listing
            </Button>
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {totalCount === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-20 text-center">
            <Car className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No listings yet</p>
            <p className="text-slate-400 text-sm mt-1 mb-4">
              Add your first car to start attracting buyers.
            </p>
            <Link href="/dealer/listings/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add listing
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => {
            let highlights: string[] = [];
            try {
              highlights = JSON.parse(listing.highlights);
            } catch {}

            return (
              <Card
                key={listing.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-0">
                  {listing.imageUrl ? (
                    <div className="h-36 rounded-t-xl overflow-hidden bg-slate-100">
                      <img
                        src={listing.imageUrl}
                        alt={`${listing.brand} ${listing.model}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-36 rounded-t-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
                      <Car className="h-10 w-10 text-slate-300" />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-slate-900 leading-tight">
                        {listing.brand} {listing.model}
                      </p>
                      <div className="flex flex-col gap-1 items-end flex-shrink-0">
                        {listing.status === "pending" && (
                          <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        )}
                        {listing.status === "published" && (
                          <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            <CheckCircle2 className="h-3 w-3" /> Live
                          </span>
                        )}
                        {listing.status === "rejected" && (
                          <span className="flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                            <XCircle className="h-3 w-3" /> Rejected
                          </span>
                        )}
                        <Badge
                          variant={
                            listing.condition === "new"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {listing.condition === "new" ? "New" : "Used"}
                        </Badge>
                      </div>
                    </div>

                    {listing.status === "pending" && (
                      <p className="text-xs text-amber-600 mb-1">
                        Awaiting admin approval before going live.
                      </p>
                    )}
                    {listing.status === "rejected" && (
                      <p className="text-xs text-red-500 mb-1">
                        Not approved. Edit and resubmit or contact admin.
                      </p>
                    )}

                    <p className="text-xs text-slate-500 mb-1">
                      {listing.carType} · {listing.rangeKm} km range
                    </p>
                    <p className="text-emerald-600 font-semibold text-sm mb-2">
                      S${Number(listing.priceMin).toLocaleString()} – S$
                      {Number(listing.priceMax).toLocaleString()}
                    </p>

                    {highlights.length > 0 && (
                      <ul className="text-xs text-slate-500 mb-3 space-y-0.5">
                        {highlights.slice(0, 2).map((h, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-emerald-400 flex-shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Link href={`/cars/${listing.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-1.5 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" /> View
                        </Button>
                      </Link>
                      <Link href={`/dealer/listings/edit/${listing.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:border-red-200"
                        disabled={deletingId === listing.id}
                        onClick={() =>
                          handleDelete(
                            listing.id,
                            `${listing.brand} ${listing.model}`,
                          )
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <Building2 className="inline h-4 w-4 mr-1.5 -mt-0.5" />
        Cars you add here appear live on the public SGElectrik listings and in
        buyer AI recommendations.
      </div>
    </div>
  );
}
