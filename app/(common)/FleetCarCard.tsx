"use client";

import { useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car as CarIcon, Gauge, Users, Zap, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface FleetCar {
  id: number;
  model: string;
  image_id: string | null;
  gallery_images?: string[] | null;
  price_from: string;
  price_period: string;
  range_km: number;
  seats: number;
  accel: string;
  charge_time: string;
  body_type: string;
}

interface Props {
  car: FleetCar;
  onEdit: (car: FleetCar) => void;
  onDeleted: (id: number) => void;
}

export function FleetCarCard({ car, onEdit, onDeleted }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Remove ${car.model} from your fleet?`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/rental-company-fleet/${car.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast({ title: "Failed to remove car", variant: "destructive" });
        return;
      }
      toast({ title: "Fleet car removed" });
      onDeleted(car.id);
    });
  }

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="h-32 bg-slate-100 flex items-center justify-center">
        {car.image_id ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={car.image_id}
            alt={car.model}
            className="w-full h-full object-cover"
          />
        ) : (
          <CarIcon className="h-8 w-8 text-slate-300" />
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{car.model}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {car.body_type || "—"}
          </p>
        </div>

        <div className="text-sm text-slate-600 space-y-1.5">
          {car.price_from && (
            <div className="text-emerald-600 font-medium">
              From {car.price_from}
              {car.price_period}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-slate-400" />
              {car.range_km} km
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              {car.seats}
            </span>
            {car.accel && (
              <span className="flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5 text-slate-400" />
                {car.accel}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => onEdit(car)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isPending ? "Removing…" : "Remove"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
