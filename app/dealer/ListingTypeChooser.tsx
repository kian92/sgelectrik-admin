"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Car, Truck, ChevronRight } from "lucide-react";

export function ListingTypeChooser({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  function choose(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>What would you like to manage?</DialogTitle>
          <DialogDescription>
            Passenger cars and commercial EVs are managed separately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          <button
            onClick={() => choose("/dealer/cars")}
            className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Car className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">Passenger Cars</div>
              <div className="text-xs text-slate-500">Sedans, SUVs, hatchbacks &amp; more</div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 ml-auto flex-shrink-0" />
          </button>
          <button
            onClick={() => choose("/dealer/commercial-evs")}
            className="w-full flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Truck className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">Commercial EVs</div>
              <div className="text-xs text-slate-500">Vans, trucks, lorries &amp; buses</div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 ml-auto flex-shrink-0" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
