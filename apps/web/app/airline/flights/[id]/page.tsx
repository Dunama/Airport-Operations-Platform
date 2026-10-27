"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ArrowLeft, History } from "lucide-react";

import { loadFlightDetail } from "@/lib/data";
import { airportCode, isArrival, turnaroundProgress, turnaroundState } from "@/lib/derive";
import { formatTime, relativeLabel } from "@/lib/format";
import { useAsync } from "@/lib/use-async";
import { StatusChip } from "@/components/status/status-chip";
import { PageHeader } from "@/components/layout/page-header";
import { MilestoneList } from "@/components/turnaround/milestone-list";
import { Query } from "@/components/async/query";
import { EmptyState, ListSkeleton } from "@/components/async/states";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AirlineFlightDetailPage() {
  const { id } = useParams<{ id: string }>();
  const result = useAsync(`flight:${id}`, () => loadFlightDetail(Number(id)));

  return (
    <div>
      <Link
        href="/airline/flights"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-4" />
        Flights
      </Link>

      <Query result={result} skeleton={<ListSkeleton rows={6} />}>
        {({ flight, reference, airports, turnaround, rotation }) => {
          const origin = airports.get(flight.origin_id);
          const dest = airports.get(flight.dest_id);
          const airline = reference.airlines.get(flight.airline_id);
          const aircraft = rotation
            ? reference.aircraft.get(rotation.aircraft_id)
            : undefined;
          const type = aircraft
            ? reference.aircraftTypes.get(aircraft.type_id)
            : undefined;
          const state = turnaround ? turnaroundState(turnaround) : null;

          const times = [
            { label: "Scheduled", value: flight.sched_time },
            { label: "Estimated", value: flight.est_time },
            { label: "Actual", value: flight.actual_time },
          ];

          return (
            <>
              <PageHeader
                title={`${flight.flight_no} · ${airportCode(origin)} → ${airportCode(dest)}`}
                description={`${isArrival(flight) ? "Arrival" : "Departure"} · ${
                  airline?.name ?? ""
                }`}
                actions={<StatusChip status={flight.status} showDot />}
              />

              <div className="grid gap-6 lg:grid-cols-5">
                <div className="flex flex-col gap-6 lg:col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Schedule</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-3">
                      {times.map((time) => (
                        <div
                          key={time.label}
                          className="rounded-lg bg-muted/60 px-3 py-2.5"
                        >
                          <div className="text-xs text-muted-foreground">
                            {time.label}
                          </div>
                          <div className="text-lg font-semibold tabular-nums">
                            {formatTime(time.value)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {relativeLabel(time.value)}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="size-4 text-muted-foreground" />
                        Turnaround
                      </CardTitle>
                      <CardDescription>
                        {turnaround
                          ? `Rotation #${turnaround.rotation_id}`
                          : "No turnaround data"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {turnaround ? (
                        <MilestoneList turnaround={turnaround} />
                      ) : (
                        <EmptyState title="No milestones available" />
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col gap-6 lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Aircraft</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm font-medium">
                        {aircraft?.registration ?? "—"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {type?.icao_code ?? ""}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Status</CardTitle>
                      <CardDescription>{state ? <StatusChip status={state} /> : "—"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {turnaround && (
                        <>
                          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span className="tabular-nums">
                              {turnaroundProgress(turnaround)}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-status-neutral-soft">
                            <div
                              className="h-full rounded-full bg-status-ok"
                              style={{
                                width: `${turnaroundProgress(turnaround)}%`,
                              }}
                            />
                          </div>
                          <Button
                            render={<Link href={`/ground/turnaround/${turnaround.rotation_id}`} />}
                            nativeButton={false}
                            variant="outline"
                            size="sm"
                            className="mt-4 w-full"
                          >
                            View turnaround
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          );
        }}
      </Query>
    </div>
  );
}
