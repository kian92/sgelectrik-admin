"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

type Dealer = { id: number; name: string; email: string };

type Props = {
  selected: Dealer[];
  onChange: (dealers: Dealer[]) => void;
};

export default function UserSelector({ selected, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/users/search?q=${encodeURIComponent(query)}`,
        );
        setResults(await res.json());
      } catch (err) {
        console.error("User search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function toggleDealer(dealer: Dealer) {
    const exists = selected.some((d) => d.id === dealer.id);
    onChange(
      exists
        ? selected.filter((d) => d.id !== dealer.id)
        : [...selected, dealer],
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name or email"
          className="w-full rounded-lg border pl-9 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {loading && <p className="text-xs text-slate-400">Searching...</p>}

      {results.length > 0 && (
        <div className="rounded-lg border divide-y max-h-56 overflow-y-auto">
          {results.map((dealer) => {
            const isSelected = selected.some((d) => d.id === dealer.id);
            return (
              <button
                key={dealer.id}
                type="button"
                onClick={() => toggleDealer(dealer)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                  isSelected ? "bg-emerald-50" : ""
                }`}
              >
                <span>
                  <span className="font-medium">{dealer.name}</span>{" "}
                  <span className="text-slate-400">{dealer.email}</span>
                </span>
                {isSelected && (
                  <span className="text-xs text-emerald-600 font-medium">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((dealer) => (
            <span
              key={dealer.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs"
            >
              {dealer.name}
              <button
                type="button"
                onClick={() => toggleDealer(dealer)}
                className="hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500">
        {selected.length} user{selected.length === 1 ? "" : "s"} selected
      </p>
    </div>
  );
}
