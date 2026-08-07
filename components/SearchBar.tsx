"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  /** Current committed value (controlled from the parent). */
  value: string;
  /** Called with the new value after the debounce delay. */
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Debounce delay in ms before onChange fires. Default 250ms. */
  debounceMs?: number;
  /** Autofocus the input on mount. */
  autoFocus?: boolean;
}

/**
 * Generic debounced search input used across admin list pages
 * (blog, workshops, ev-rental, commercial-ev, promotions, ...).
 *
 * Usage:
 *   const [search, setSearch] = useState("");
 *   <SearchBar value={search} onChange={setSearch} placeholder="Search posts..." />
 *
 * Filter your list with `search` the same way you already filter by status/category.
 */
export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  debounceMs = 250,
  autoFocus = false,
}: SearchBarProps) {
  const [local, setLocal] = useState(value);

  // Stay in sync if the parent resets the value externally (e.g. "Clear filters").
  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-colors"
      />
      {local && (
        <button
          type="button"
          onClick={() => setLocal("")}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
