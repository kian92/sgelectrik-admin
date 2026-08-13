"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FaqCard, type Faq } from "./FaqCard";
import { FaqForm } from "./FaqForm";

interface Props {
  rentalCompanyId: number | null;
  initialFaqs: Faq[];
}

type Mode = { type: "add" } | { type: "edit"; faq: Faq } | null;

export function FaqSection({ rentalCompanyId, initialFaqs }: Props) {
  const [faqs, setFaqs] = useState<Faq[]>(initialFaqs);
  const [mode, setMode] = useState<Mode>(null);

  function handleSaved(faq: Faq) {
    setFaqs((prev) => {
      const exists = prev.some((f) => f.id === faq.id);
      return exists
        ? prev.map((f) => (f.id === faq.id ? faq : f))
        : [...prev, faq];
    });
    setMode(null);
  }

  function handleDeleted(id: number) {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    setMode((m) => (m?.type === "edit" && m.faq.id === id ? null : m));
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          FAQs ({faqs.length})
        </CardTitle>
        {rentalCompanyId && mode === null && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMode({ type: "add" })}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add FAQ
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!rentalCompanyId ? (
          <p className="text-sm text-slate-400">
            Save your rental profile first, then add FAQs.
          </p>
        ) : (
          <>
            {mode?.type === "add" && (
              <FaqForm
                rentalCompanyId={rentalCompanyId}
                onSaved={handleSaved}
                onCancel={() => setMode(null)}
              />
            )}

            {faqs.length === 0 && mode === null && (
              <p className="text-sm text-slate-400">
                No FAQs yet. Click &quot;Add FAQ&quot; to add one.
              </p>
            )}

            {faqs.map((faq) =>
              mode?.type === "edit" && mode.faq.id === faq.id ? (
                <FaqForm
                  key={faq.id}
                  rentalCompanyId={rentalCompanyId}
                  existing={faq}
                  onSaved={handleSaved}
                  onCancel={() => setMode(null)}
                />
              ) : (
                <FaqCard
                  key={faq.id}
                  faq={faq}
                  onEdit={(f) => setMode({ type: "edit", faq: f })}
                  onDeleted={handleDeleted}
                />
              ),
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
