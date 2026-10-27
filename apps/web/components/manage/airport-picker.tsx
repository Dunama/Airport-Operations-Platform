"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";

import { api } from "@/lib/api";
import type { Airport } from "@/lib/types";
import { Input } from "@/components/ui/input";

export function airportLabel(airport: Airport): string {
  return `${airport.iata} · ${airport.name}`;
}

export function AirportPicker({
  id,
  initialLabel,
  onChange,
  placeholder = "Search airport by IATA or name…",
}: {
  id?: string;
  initialLabel?: string;
  onChange: (airport: Airport) => void;
  placeholder?: string;
}) {
  const [term, setTerm] = React.useState(initialLabel ?? "");
  const [open, setOpen] = React.useState(false);
  const [results, setResults] = React.useState<Airport[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const q = term.trim();
    let active = true;
    const timer = setTimeout(() => {
      if (q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      api.searchAirports(q).then(
        (items) => {
          if (!active) return;
          setResults(items);
          setLoading(false);
        },
        () => {
          if (!active) return;
          setResults([]);
          setLoading(false);
        }
      );
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term]);

  function select(airport: Airport) {
    setTerm(airportLabel(airport));
    setOpen(false);
    onChange(airport);
  }

  const showResults = open && term.trim().length >= 2;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="pl-9"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {showResults && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg bg-popover p-1 shadow-md ring-1 ring-foreground/10">
          {results.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              {loading ? "Searching…" : "No airports found."}
            </p>
          ) : (
            results.map((airport) => (
              <button
                key={airport.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(airport)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
              >
                <span className="font-medium">{airport.iata}</span>
                <span className="truncate text-muted-foreground">
                  {airport.name}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
