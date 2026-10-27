"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ArrowLeft, Clock, Users } from "lucide-react";

import { loadTurnaroundDetail } from "@/lib/data";
import { airportCode, counterpartAirport, isArrival, turnaroundProgress, turnaroundState } from "@/lib/derive";
import { formatTime, relativeLabel } from "@/lib/format";
import { useAsync } from "@/lib/use-async";
import { useSession } from "@/lib/use-session";
import { etaByRotation } from "@/lib/eta";
import { InboundEtaLine, useInboundFeed } from "@/components/eta/inbound-eta";
import { StatusChip } from "@/components/status/status-chip";
import { PageHeader } from "@/components/layout/page-header";
import { MilestoneRecorder } from "@/components/turnaround/milestone-recorder";
import { GateCard } from "@/components/turnaround/gate-card";
import { Query } from "@/components/async/query";
import { EmptyState, ListSkeleton } from "@/components/async/states";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TurnaroundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const session = useSession();
  const result = useAsync(`turnaround:${id}`, () =>
    loadTurnaroundDetail(Number(id))
  );

  const feed = useInboundFeed();
  const inbound = etaByRotation(
    feed.state.status === "ready" ? feed.state.data.items : []
  ).get(Number(id));

  return (
    <div>
      <Link
        href="/ground/turnaround"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-4" />
        Turnaround board
      </Link>

      <Query result={result} skeleton={<ListSkeleton rows={6} />}>
        {({
          row,
          reference,
          airports,
          assignments,
          staffByShift,
          gateAssignment,
          rotations,
          optimizationRuns,
        }) => {
          if (!row) {
            return (
              <Card className="p-0 ring-0">
                <EmptyState
                  title="Turnaround not found"
                  hint="It may have been reassigned."
                />
              </Card>
            );
          }
          const { turnaround, rotation, flights } = row;
          const state = turnaroundState(turnaround);
          const progress = turnaroundProgress(turnaround);
          const aircraft = rotation
            ? reference.aircraft.get(rotation.aircraft_id)
            : undefined;
          const type = aircraft
            ? reference.aircraftTypes.get(aircraft.type_id)
            : undefined;

          return (
            <>
              <PageHeader
                title={
                  flights.map((f) => f.flight_no).join(" · ") ||
                  `Rotation #${turnaround.rotation_id}`
                }
                description={
                  aircraft
                    ? `${aircraft.registration}${type ? ` · ${type.icao_code}` : ""}`
                    : "Unassigned aircraft"
                }
                actions={<StatusChip status={state} showDot />}
              />

              <InboundEtaLine item={inbound} className="mb-6" />

              <div className="grid gap-6 lg:grid-cols-5">
                <div className="flex flex-col gap-6 lg:col-span-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Milestones</CardTitle>
                      <CardDescription>Ramp sequence for this turnaround</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MilestoneRecorder
                        turnaround={turnaround}
                        onRecorded={result.reload}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Movements</CardTitle>
                      <CardDescription>
                        {isArrival(flights[0] ?? { direction: "ARR" })
                          ? "Inbound then outbound legs"
                          : "Legs on this rotation"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {flights.length === 0 ? (
                        <EmptyState title="No flights on this rotation" />
                      ) : (
                        <ul className="flex flex-col divide-y divide-border">
                          {flights.map((flight) => {
                            const airport = counterpartAirport(flight, airports);
                            return (
                              <li
                                key={flight.id}
                                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                              >
                                <span className="w-14 text-sm font-semibold tabular-nums">
                                  {formatTime(flight.sched_time)}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <Link
                                    href={`/ground/flights/${flight.id}`}
                                    className="text-sm font-medium underline-offset-4 hover:underline"
                                  >
                                    {flight.flight_no}
                                  </Link>
                                  <div className="truncate text-xs text-muted-foreground">
                                    {isArrival(flight) ? "from" : "to"}{" "}
                                    {airportCode(airport)}
                                  </div>
                                </div>
                                <StatusChip status={flight.status} />
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col gap-6 lg:col-span-2">
                  <GateCard
                    rotationId={turnaround.rotation_id}
                    assignment={gateAssignment}
                    gates={Array.from(reference.gates.values())}
                    rotations={rotations}
                    aircraft={reference.aircraft}
                    optimizationRuns={optimizationRuns}
                    requestedBy={session?.id ?? 0}
                    inbound={inbound}
                    onChanged={result.reload}
                  />

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="size-4 text-muted-foreground" />
                        Timing
                      </CardTitle>
                      <CardDescription>
                        {progress}% of milestones complete
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className="flex flex-col gap-3 text-sm">
                        <div className="flex items-center justify-between">
                          <dt className="text-muted-foreground">On block (plan)</dt>
                          <dd className="tabular-nums">
                            {formatTime(rotation?.on_block_planned)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="text-muted-foreground">Off block (plan)</dt>
                          <dd className="tabular-nums">
                            {formatTime(rotation?.off_block_planned)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between">
                          <dt className="text-muted-foreground">Predicted ready</dt>
                          <dd className="tabular-nums">
                            {formatTime(turnaround.predicted_ready)}
                          </dd>
                        </div>
                        <div className="flex items-center justify-between border-t border-border pt-3">
                          <dt className="text-muted-foreground">Target off block</dt>
                          <dd className="font-medium tabular-nums">
                            {formatTime(turnaround.tobt)}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              {relativeLabel(turnaround.tobt)}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="size-4 text-muted-foreground" />
                        Assigned crew
                      </CardTitle>
                      <CardDescription>
                        {assignments.length} task
                        {assignments.length === 1 ? "" : "s"} on this turnaround
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {assignments.length === 0 ? (
                        <EmptyState
                          title="No crew assigned"
                          hint="Assignments appear here once rostered."
                        />
                      ) : (
                        <ul className="flex flex-col gap-3">
                          {assignments.map((assignment) => {
                            const member = staffByShift.get(assignment.shift_id);
                            return (
                              <li
                                key={assignment.id}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="text-sm capitalize">
                                  {assignment.task.replace(/_/g, " ")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {member?.name ?? `Shift #${assignment.shift_id}`}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
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
