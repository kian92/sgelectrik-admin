"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FleetCarCard, type FleetCar } from "./FleetCarCard";
import { FleetCarForm } from "./FleetCarForm";

interface Props {
  rentalCompanyId: number | null;
  initialFleet: FleetCar[];
}

type Mode = { type: "add" } | { type: "edit"; car: FleetCar } | null;

export function FleetSection({ rentalCompanyId, initialFleet }: Props) {
  const [fleet, setFleet] = useState<FleetCar[]>(initialFleet);
  const [mode, setMode] = useState<Mode>(null);

  function handleSaved(car: FleetCar) {
    setFleet((prev) => {
      const exists = prev.some((c) => c.id === car.id);
      return exists
        ? prev.map((c) => (c.id === car.id ? car : c))
        : [...prev, car];
    });
    setMode(null);
  }

  function handleDeleted(id: number) {
    setFleet((prev) => prev.filter((c) => c.id !== id));
    setMode((m) => (m?.type === "edit" && m.car.id === id ? null : m));
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          Fleet ({fleet.length})
        </CardTitle>
        {rentalCompanyId && mode === null && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMode({ type: "add" })}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add car
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!rentalCompanyId ? (
          <p className="text-sm text-slate-400">
            Save your rental profile first, then add fleet cars.
          </p>
        ) : (
          <>
            {mode?.type === "add" && (
              <FleetCarForm
                rentalCompanyId={rentalCompanyId}
                onSaved={handleSaved}
                onCancel={() => setMode(null)}
              />
            )}

            {fleet.length === 0 && mode === null && (
              <p className="text-sm text-slate-400">
                No fleet cars yet. Click &quot;Add car&quot; to add one.
              </p>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fleet.map((car) =>
                mode?.type === "edit" && mode.car.id === car.id ? (
                  <div key={car.id} className="sm:col-span-2 lg:col-span-3">
                    <FleetCarForm
                      rentalCompanyId={rentalCompanyId}
                      existing={car}
                      onSaved={handleSaved}
                      onCancel={() => setMode(null)}
                    />
                  </div>
                ) : (
                  <FleetCarCard
                    key={car.id}
                    car={car}
                    onEdit={(c) => setMode({ type: "edit", car: c })}
                    onDeleted={handleDeleted}
                  />
                ),
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
