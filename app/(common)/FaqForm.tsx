"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Faq } from "./FaqCard";

interface Props {
  rentalCompanyId: number;
  existing?: Faq;
  onSaved: (faq: Faq) => void;
  onCancel: () => void;
}

export function FaqForm({ rentalCompanyId, existing, onSaved, onCancel }: Props) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!existing;
  const [question, setQuestion] = useState(existing?.question ?? "");
  const [answer, setAnswer] = useState(existing?.answer ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    startTransition(async () => {
      const url = isEdit
        ? `/api/rental-company-faqs/${existing!.id}`
        : `/api/rental-companies/${rentalCompanyId}/faqs`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        toast({ title: err.error ?? "Failed to save", variant: "destructive" });
        return;
      }

      const saved = await res.json();
      toast({ title: isEdit ? "FAQ updated" : "FAQ added" });
      onSaved(saved);
    });
  }

  return (
    <Card className="border-0 shadow-sm ring-1 ring-emerald-200">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          {isEdit ? "Edit FAQ" : "Add FAQ"}
        </CardTitle>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Question *</Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What are the minimum leasing requirements?"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Answer *</Label>
            <Textarea
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="You must be 23 years or older with a valid driving license..."
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !question.trim() || !answer.trim()}
              className="gap-2"
            >
              {isPending ? (
                "Saving…"
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {isEdit ? "Save changes" : "Add FAQ"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
