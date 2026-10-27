"use client";

import Link from "next/link";
import { ChevronRight, Plane } from "lucide-react";

import { loadAirlineDashboard } from "@/lib/data";
import { counterpartAirport, isArrival } from "@/lib/derive";
import { formatTime, isToday } from "@/lib/format";
import { useAsync } from "@/lib/use-async";
import { useSession } from "@/lib/use-session";
import { PageHeader } from "@/components/layout/page-header";
import { KpiTile } from "@/components/kpi/kpi-tile";
import { StatusChip } from "@/components/status/status-chip";
import { Query } from "@/components/async/query";
import { EmptyState, ListSkeleton, TileSkeleton } from "@/components/async/states";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AirlineDashboardPage() {
  const session = useSession();
  const airlineId = session?.airlineId ?? 0;
  const result = useAsync(`airline-dashboard:${airlineId}`, () =>
    loadAirlineDashboard(airlineId)
  );

  return (
    <div>
      <PageHeader
        title="Airline dashboard"
        description={session?.role === "airline" ? "Your fleet movements" : "Airline overview"}
      />
      <Query
        result={result}
        skeleton={
          <div className="flex flex-col gap-6">
            <TileSkeleton />
            <ListSkeleton rows={6} />
          </div>
        }
      >
        {({ flights, airports, airline }) => {
          const myFlights = airlineId
            ? flights.filter((f) => f.airline_id === airlineId)
            : flights;
          const today = myFlights.filter((f) => isToday(f.sched_time));
          const delayed = today.filter((f) => f.status === "delayed");
          const cancelled = today.filter((f) => f.status === "cancelled");
          const onTime = today.filter((f) => f.status === "on_time");
          const onTimePct =
            today.length === 0 ? null : Math.round((onTime.length / today.length) * 100);

          const next = today
            .filter((f) => !["departed", "arrived"].includes(f.status))
            .sort((a, b) => a.sched_time.localeCompare(b.sched_time))
            .slice(0, 6);

          return (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiTile
                  label="Flights today"
                  value={today.length}
                  hint={airline?.name}
                />
                <KpiTile
                  label="On time"
                  value={onTimePct === null ? "—" : `${onTimePct}%`}
                  tone={onTimePct !== null && onTimePct >= 85 ? "ok" : "pending"}
                />
                <KpiTile
                  label="Delayed"
                  value={delayed.length}
                  tone={delayed.length ? "pending" : "ok"}
                />
                <KpiTile
                  label="Cancelled"
                  value={cancelled.length}
                  tone={cancelled.length ? "critical" : "ok"}
                />
              </div>

              <Card className="mt-6 ring-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="size-4 text-muted-foreground" />
                    Next departures/arrivals
                  </CardTitle>
                  <CardDescription>Your movements for today</CardDescription>
                </CardHeader>
                <CardContent>
                  {next.length === 0 ? (
                    <EmptyState title="No upcoming movements" />
                  ) : (
                    <ul className="flex flex-col divide-y divide-border">
                      {next.map((flight) => {
                        const airport = counterpartAirport(flight, airports);
                        return (
                          <li key={flight.id}>
                            <Link
                              href={`/airline/flights/${flight.id}`}
                              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                            >
                              <span className="w-12 text-sm font-semibold tabular-nums">
                                {formatTime(flight.sched_time)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium">
                                  {flight.flight_no}
                                  <span className="ml-2 font-normal text-muted-foreground">
                                    {isArrival(flight) ? "from" : "to"} {airport?.iata ?? "—"}
                                  </span>
                                </div>
                                <div className="truncate text-xs text-muted-foreground">
                                  {airport?.name ?? ""}
                                </div>
                              </div>
                              <StatusChip status={flight.status} />
                              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </>
          );
        }}
      </Query>
    </div>
  );
}
