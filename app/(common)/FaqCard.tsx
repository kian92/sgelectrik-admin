"use client";

import { useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface Faq {
  id: number;
  question: string;
  answer: string;
  sort_order?: number;
}

interface Props {
  faq: Faq;
  onEdit: (faq: Faq) => void;
  onDeleted: (id: number) => void;
}

export function FaqCard({ faq, onEdit, onDeleted }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Remove this FAQ?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/rental-company-faqs/${faq.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast({ title: "Failed to remove FAQ", variant: "destructive" });
        return;
      }
      toast({ title: "FAQ removed" });
      onDeleted(faq.id);
    });
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <p className="font-medium text-slate-900">{faq.question}</p>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-slate-500 hover:text-slate-800"
              onClick={() => onEdit(faq)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-slate-600">{faq.answer}</p>
      </CardContent>
    </Card>
  );
}
