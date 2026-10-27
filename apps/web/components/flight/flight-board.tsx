"use client";

import * as React from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";

import type { Airline, Airport, Flight } from "@/lib/types";
import { counterpartAirport, isArrival } from "@/lib/derive";
import { formatTime } from "@/lib/format";
import { StatusChip } from "@/components/status/status-chip";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/async/states";

interface FlightBoardProps {
  flights: Flight[];
  airports: Map<number, Airport>;
  airlines: Map<number, Airline>;
  baseHref: string;
}

function Board({
  flights,
  airports,
  airlines,
  baseHref,
  endpoint,
}: FlightBoardProps & { endpoint: string }) {
  if (flights.length === 0) {
    return (
      <Card className="p-0 ring-0">
        <EmptyState
          title={`No ${endpoint} match your filters`}
          hint="Try clearing the search box."
        />
      </Card>
    );
  }

  return (
    <Card className="p-0 ring-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sched</TableHead>
            <TableHead>Flight</TableHead>
            <TableHead className="hidden sm:table-cell">
              {endpoint === "departures" ? "Destination" : "Origin"}
            </TableHead>
            <TableHead className="hidden md:table-cell">Airline</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {flights.map((flight) => {
            const airport = counterpartAirport(flight, airports);
            const airline = airlines.get(flight.airline_id);
            return (
              <TableRow key={flight.id}>
                <TableCell className="tabular-nums">
                  {formatTime(flight.sched_time)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`${baseHref}/${flight.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {flight.flight_no}
                  </Link>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {airport?.name ?? "—"}
                  {airport && (
                    <span className="ml-1.5 text-xs">({airport.iata})</span>
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {airline?.name ?? `#${flight.airline_id}`}
                </TableCell>
                <TableCell>
                  <StatusChip status={flight.status} showDot />
                </TableCell>
                <TableCell>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

export function FlightBoard({ flights, airports, airlines, baseHref }: FlightBoardProps) {
  const [query, setQuery] = React.useState("");

  const q = query.trim().toLowerCase();
  const matches = (flight: Flight) => {
    if (q === "") return true;
    const airport = counterpartAirport(flight, airports);
    const airline = airlines.get(flight.airline_id);
    return (
      flight.flight_no.toLowerCase().includes(q) ||
      (airport?.iata.toLowerCase().includes(q) ?? false) ||
      (airport?.name.toLowerCase().includes(q) ?? false) ||
      (airline?.name.toLowerCase().includes(q) ?? false)
    );
  };

  const departures = flights.filter((f) => !isArrival(f) && matches(f));
  const arrivals = flights.filter((f) => isArrival(f) && matches(f));

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search flight, airline or airport…"
          className="pl-9"
          aria-label="Search flights"
        />
      </div>

      <Tabs defaultValue="departures">
        <TabsList>
          <TabsTrigger value="departures">
            Departures ({departures.length})
          </TabsTrigger>
          <TabsTrigger value="arrivals">
            Arrivals ({arrivals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departures">
          <Board
            endpoint="departures"
            flights={departures}
            airports={airports}
            airlines={airlines}
            baseHref={baseHref}
          />
        </TabsContent>
        <TabsContent value="arrivals">
          <Board
            endpoint="arrivals"
            flights={arrivals}
            airports={airports}
            airlines={airlines}
            baseHref={baseHref}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
