"use client";

import Link from "next/link";
import {
  ChevronRight,
  TriangleAlert,
  PlaneTakeoff,
  ClipboardList,
  Plus,
} from "lucide-react";

import { loadGroundDashboard } from "@/lib/data";
import { counterpartAirport, isArrival, turnaroundProgress, turnaroundState } from "@/lib/derive";
import { formatTime, isToday, relativeLabel } from "@/lib/format";
import { severityMeta } from "@/lib/status";
import { useAsync } from "@/lib/use-async";
import { useSession } from "@/lib/use-session";
import { PageHeader } from "@/components/layout/page-header";
import { KpiTile } from "@/components/kpi/kpi-tile";
import { StatusChip, StatusDot } from "@/components/status/status-chip";
import { InboundEtaFeed } from "@/components/eta/inbound-eta";
import { ShiftProgress } from "@/components/shift-progress";
import { Query } from "@/components/async/query";
import { EmptyState, ListSkeleton, TileSkeleton } from "@/components/async/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const OPEN_STATUSES = ["open", "investigating"];

function severityChip(severity: number) {
  const meta = severityMeta(severity);
  return <StatusChip status="severity" label={meta.label} tone={meta.tone} />;
}

export default function GroundDashboardPage() {
  const session = useSession();
  const userId = session?.id ?? 0;
  const result = useAsync(`ground-dashboard:${userId}`, () =>
    loadGroundDashboard(userId)
  );

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Ground handling overview for today"
        actions={
          <Button
            render={<Link href="/ground/incidents/new" />}
            nativeButton={false}
            variant="outline"
            size="sm"
          >
            <Plus />
            Report incident
          </Button>
        }
      />

      <Query
        result={result}
        skeleton={
          <div className="flex flex-col gap-6">
            <TileSkeleton />
            <ListSkeleton rows={5} />
          </div>
        }
      >
        {({ flights, turnarounds, incidents, airports, schedule, reference, gateAssignments }) => {
          const gateByRotation = new Map<number, string>();
          for (const assignment of gateAssignments) {
            if (!assignment.is_active) continue;
            const gate = reference.gates.get(assignment.gate_id);
            if (gate) gateByRotation.set(assignment.rotation_id, gate.code);
          }
          const openGates = Array.from(reference.gates.values()).filter(
            (g) => g.status === "open"
          ).length;
          const totalGates = reference.gates.size;

          const today = flights.filter((f) => isToday(f.sched_time));
          const delayed = today.filter((f) => f.status === "delayed");
          const onTrack = today.filter((f) =>
            ["on_time", "boarding", "departed", "arrived"].includes(f.status)
          );
          const onTimePct =
            today.length === 0
              ? null
              : Math.round((onTrack.length / today.length) * 100);
          const openIncidents = incidents.filter((i) =>
            OPEN_STATUSES.includes(i.status)
          );

          const flightsByRotation = new Map<number, typeof flights>();
          for (const flight of flights) {
            const list = flightsByRotation.get(flight.rotation_id) ?? [];
            list.push(flight);
            flightsByRotation.set(flight.rotation_id, list);
          }

          const live = today
            .filter((f) => !["departed", "arrived"].includes(f.status))
            .sort((a, b) => a.sched_time.localeCompare(b.sched_time))
            .slice(0, 6);

          const attention = turnarounds
            .map((t) => ({
              turnaround: t,
              state: turnaroundState(t),
              progress: turnaroundProgress(t),
              flights: flightsByRotation.get(t.rotation_id) ?? [],
            }))
            .filter((row) => row.state === "at_risk" || row.state === "in_progress");

          const shift = schedule.shifts[0];

          return (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <KpiTile
                  label="Movements today"
                  value={today.length}
                  hint={`${flights.length} on the board`}
                />
                <KpiTile
                  label="On time"
                  value={onTimePct === null ? "—" : `${onTimePct}%`}
                  hint={`${onTrack.length} of ${today.length} movements`}
                  tone={
                    onTimePct === null
                      ? "neutral"
                      : onTimePct >= 85
                        ? "ok"
                        : "pending"
                  }
                />
                <KpiTile
                  label="Delayed"
                  value={delayed.length}
                  hint={delayed.length ? "Crew reassignment may be needed" : "No delays"}
                  tone={delayed.length ? "pending" : "ok"}
                />
                <KpiTile
                  label="Open incidents"
                  value={openIncidents.length}
                  hint={openIncidents.length ? "Requires attention" : "All clear"}
                  tone={openIncidents.length ? "critical" : "ok"}
                />
                <KpiTile
                  label="Gates open"
                  value={`${openGates}/${totalGates}`}
                  hint={totalGates ? "Available on the apron" : "No gates configured"}
                  tone={openGates === 0 && totalGates > 0 ? "critical" : "ok"}
                />
              </div>

              <InboundEtaFeed className="mt-6" />

              <div className="mt-6 grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PlaneTakeoff className="size-4 text-muted-foreground" />
                      Live board
                    </CardTitle>
                    <CardDescription>Next movements today</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {live.length === 0 ? (
                      <EmptyState title="No upcoming movements" />
                    ) : (
                      <ul className="flex flex-col divide-y divide-border">
                        {live.map((flight) => {
                          const airport = counterpartAirport(flight, airports);
                          return (
                            <li key={flight.id}>
                              <Link
                                href={`/ground/flights/${flight.id}`}
                                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                              >
                                <span className="w-12 text-sm font-semibold tabular-nums">
                                  {formatTime(flight.sched_time)}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium">
                                    {flight.flight_no}
                                    <span className="ml-2 font-normal text-muted-foreground">
                                      {isArrival(flight) ? "from" : "to"}{" "}
                                      {airport?.iata ?? "—"}
                                    </span>
                                  </div>
                                  <div className="truncate text-xs text-muted-foreground">
                                    {airport?.name ?? "Unknown airport"} ·{" "}
                                    {relativeLabel(flight.sched_time)}
                                  </div>
                                </div>
                                {gateByRotation.get(flight.rotation_id) && (
                                  <Badge variant="outline">
                                    {gateByRotation.get(flight.rotation_id)}
                                  </Badge>
                                )}
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

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Turnarounds</CardTitle>
                    <CardDescription>Active turnarounds needing work</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {attention.length === 0 ? (
                      <EmptyState title="No active turnarounds" />
                    ) : (
                      <ul className="flex flex-col divide-y divide-border">
                        {attention.map((row) => (
                          <li key={row.turnaround.rotation_id}>
                            <Link
                              href={`/ground/turnaround/${row.turnaround.rotation_id}`}
                              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium">
                                  {row.flights
                                    .map((f) => f.flight_no)
                                    .join(" · ") || `Rotation #${row.turnaround.rotation_id}`}
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-status-neutral-soft">
                                    <div
                                      className="h-full rounded-full bg-status-ok"
                                      style={{ width: `${row.progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground tabular-nums">
                                    {row.progress}%
                                  </span>
                                </div>
                              </div>
                              {gateByRotation.get(row.turnaround.rotation_id) && (
                                <Badge variant="outline">
                                  {gateByRotation.get(row.turnaround.rotation_id)}
                                </Badge>
                              )}
                              <StatusChip status={row.state} showDot />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TriangleAlert className="size-4 text-muted-foreground" />
                      Open incidents
                    </CardTitle>
                    <CardDescription>Reported and still being worked</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {openIncidents.length === 0 ? (
                      <p className="text-sm text-status-ok">
                        No open incidents — everything on track.
                      </p>
                    ) : (
                      <ul className="flex flex-col divide-y divide-border">
                        {openIncidents.map((incident) => (
                          <li
                            key={incident.id}
                            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                          >
                            {severityChip(incident.severity)}
                            <span className="text-sm font-medium">
                              #{incident.id} · {incident.category.replace(/_/g, " ")}
                            </span>
                            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                              <StatusDot status={incident.status} />
                              {relativeLabel(incident.created_at)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link
                      href="/ground/incidents"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
                    >
                      All incidents
                      <ChevronRight className="size-4" />
                    </Link>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="size-4 text-muted-foreground" />
                      My shift
                    </CardTitle>
                    <CardDescription>
                      {shift
                        ? `${schedule.staff?.skill ?? "Ground"} · ${schedule.assignments.length} tasks`
                        : "No shift scheduled"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {shift ? (
                      <>
                        <ShiftProgress start={shift.start} end={shift.end} />
                        {schedule.assignments.length > 0 && (
                          <ul className="mt-4 flex flex-col gap-2">
                            {schedule.assignments.slice(0, 4).map((a) => (
                              <li
                                key={a.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="capitalize">
                                  {a.task.replace(/_/g, " ")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Rotation #{a.rotation_id}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <EmptyState
                        title="No shift today"
                        hint="Check your schedule for upcoming shifts."
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          );
        }}
      </Query>
    </div>
  );
}
