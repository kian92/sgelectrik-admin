"use client";

import Link from "next/link";
import { Car, Settings } from "lucide-react";
import { FleetSection } from "@/app/(common)/FleetSection";
import type { FleetCar } from "@/app/(common)/FleetCarCard";
import { FaqSection } from "@/app/(common)/FaqSection";
import type { Faq } from "@/app/(common)/FaqCard";

interface Props {
  rentalCompanyId: number;
  initialFleet: FleetCar[];
  initialFaqs: Faq[];
}

export default function DealerRentalsClient({
  rentalCompanyId,
  initialFleet,
  initialFaqs,
}: Props) {
  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Car className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              My EV Rentals
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage your fleet and FAQs
            </p>
          </div>
        </div>
        <Link
          href="/dealer/settings#rental-profile"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <Settings className="h-3.5 w-3.5" />
          Manage rental profile & pricing
        </Link>
      </div>

      <div className="space-y-6">
        <FleetSection
          rentalCompanyId={rentalCompanyId}
          initialFleet={initialFleet}
        />
        <FaqSection
          rentalCompanyId={rentalCompanyId}
          initialFaqs={initialFaqs}
        />
      </div>
    </div>
  );
}
