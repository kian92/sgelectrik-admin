"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Zap, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CommercialEv {
  id: number;
  name: string;
  brand: string;
  category: string;
  year: number | null;
  priceMin: number;
  priceMax: number;
  rangeKm: number;
  payloadKg: number | null;
  status: string;
  dealerSlug: string;
}

interface Props {
  ev: CommercialEv;
  editHref: string;
  onDeleted: (id: number) => void;
}

function fmt(n: number) {
  return n ? `S$${(n / 1000).toFixed(0)}k` : "—";
}

export function CommercialEvCard({ ev, editHref, onDeleted }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete ${ev.name}?`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/commercial-evs/${ev.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast({ title: "Failed to delete", variant: "destructive" });
        return;
      }
      toast({ title: "Commercial EV deleted" });
      onDeleted(ev.id);
    });
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{ev.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {ev.brand} · {ev.category}
              {ev.year ? ` · ${ev.year}` : ""}
            </p>
          </div>
          <Badge
            variant={ev.status === "active" ? "default" : "secondary"}
            className="text-xs shrink-0"
          >
            {ev.status}
          </Badge>
        </div>

        {/* Specs */}
        <div className="text-sm text-slate-600 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-slate-400" />
            {fmt(ev.priceMin)} – {fmt(ev.priceMax)}
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-emerald-500" />
            {ev.rangeKm} km range
            {ev.payloadKg ? ` · ${ev.payloadKg} kg payload` : ""}
          </div>
          {ev.dealerSlug && (
            <div className="text-xs text-slate-400">
              Dealer: {ev.dealerSlug}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <Link href={editHref}>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
