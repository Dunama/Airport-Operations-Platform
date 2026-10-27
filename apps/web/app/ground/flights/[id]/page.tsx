"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ArrowLeft, Plane, Clock, History, Activity, TrendingUp } from "lucide-react";

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

export default function FlightDetailPage() {
  const { id } = useParams<{ id: string }>();
  const result = useAsync(`flight:${id}`, () => loadFlightDetail(Number(id)));

  return (
    <div>
      <Link
        href="/ground/flights"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-4" />
        Flight board
      </Link>

      <Query result={result} skeleton={<ListSkeleton rows={6} />}>
        {({ flight, reference, airports, turnaround, rotation, events, delayPrediction }) => {
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

          const facts = [
            {
              label: "Airline",
              value: airline?.name ?? `#${flight.airline_id}`,
            },
            {
              label: "Aircraft",
              value: aircraft
                ? `${aircraft.registration}${type ? ` · ${type.icao_code}` : ""}`
                : "—",
            },
            { label: "Origin", value: `${airportCode(origin)} · ${origin?.name ?? "—"}` },
            { label: "Destination", value: `${airportCode(dest)} · ${dest?.name ?? "—"}` },
          ];

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
                      <CardDescription>All times local to station</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        {times.map((time) => (
                          <div
                            key={time.label}
                            className="rounded-lg bg-muted/60 px-3 py-2.5"
                          >
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="size-3" />
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
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {facts.map((fact) => (
                          <div
                            key={fact.label}
                            className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
                          >
                            <Plane className="size-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <div className="text-xs text-muted-foreground">
                                {fact.label}
                              </div>
                              <div className="truncate text-sm font-medium">
                                {fact.value}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="size-4 text-muted-foreground" />
                        Turnaround milestones
                      </CardTitle>
                      <CardDescription>
                        {turnaround
                          ? `Rotation #${turnaround.rotation_id}`
                          : "No turnaround opened for this rotation"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {turnaround ? (
                        <MilestoneList turnaround={turnaround} />
                      ) : (
                        <EmptyState title="No ramp events recorded" />
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="size-4 text-muted-foreground" />
                        Activity
                      </CardTitle>
                      <CardDescription>Logged events for this flight</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {events.length === 0 ? (
                        <EmptyState title="No activity logged" />
                      ) : (
                        <ul className="flex flex-col divide-y divide-border">
                          {events.map((event) => (
                            <li
                              key={event.id}
                              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                            >
                              <span className="text-sm capitalize">
                                {event.type.replace(/_/g, " ")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {relativeLabel(event.created_at)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col gap-6 lg:col-span-2">
                  {delayPrediction && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="size-4 text-muted-foreground" />
                          Delay risk
                        </CardTitle>
                        <CardDescription>
                          Model {delayPrediction.model_version}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-semibold tabular-nums">
                            {Math.round(delayPrediction.p_delay_15 * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            chance of 15+ min delay
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold tabular-nums">
                            {Math.round(delayPrediction.expected_delay_min)}m
                          </div>
                          <div className="text-xs text-muted-foreground">
                            expected delay
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Turnaround status</CardTitle>
                      <CardDescription>
                        {state ? (
                          <StatusChip status={state} />
                        ) : (
                          "Not scheduled"
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      {turnaround && (
                        <>
                          <div>
                            <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                              <span>Milestones complete</span>
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
                          </div>
                          <Button
                            render={
                              <Link
                                href={`/ground/turnaround/${turnaround.rotation_id}`}
                              />
                            }
                            nativeButton={false}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            Open turnaround
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
