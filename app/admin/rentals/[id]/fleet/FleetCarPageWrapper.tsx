"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car } from "lucide-react";
import { FleetCarForm } from "@/app/(common)/FleetCarForm";
import type { FleetCar } from "@/app/(common)/FleetCarCard";

interface Props {
  rentalCompanyId: number;
  companyName: string;
  existing?: FleetCar;
}

export default function AdminFleetCarPageWrapper({
  rentalCompanyId,
  companyName,
  existing,
}: Props) {
  const router = useRouter();
  const isEditing = !!existing;
  const backHref = `/admin/rentals/${rentalCompanyId}/fleet`;

  function handleSaved() {
    router.push(backHref);
    router.refresh();
  }

  function handleCancel() {
    router.push(backHref);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href={backHref}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-500 hover:text-slate-700 -ml-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Fleet
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Car className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? "Edit Fleet Car" : "Add Fleet Car"}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">{companyName}</p>
          </div>
        </div>
      </div>

      <FleetCarForm
        rentalCompanyId={rentalCompanyId}
        existing={existing}
        onSaved={handleSaved}
        onCancel={handleCancel}
      />
    </div>
  );
}
