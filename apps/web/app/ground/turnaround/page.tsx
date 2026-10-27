"use client";

import Link from "next/link";

import { loadTurnaroundsView } from "@/lib/data";
import { turnaroundProgress, turnaroundState } from "@/lib/derive";
import { etaByRotation, etaShort } from "@/lib/eta";
import { formatTime } from "@/lib/format";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/layout/page-header";
import { InboundEtaFeed, useInboundFeed } from "@/components/eta/inbound-eta";
import { StatusChip } from "@/components/status/status-chip";
import { Query } from "@/components/async/query";
import { EmptyState, ListSkeleton } from "@/components/async/states";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TurnaroundBoardPage() {
  const result = useAsync("turnarounds", loadTurnaroundsView);
  const feed = useInboundFeed();
  const etas = etaByRotation(
    feed.state.status === "ready" ? feed.state.data.items : []
  );

  return (
    <div>
      <PageHeader
        title="Turnarounds"
        description="Every rotation with a turnaround, newest first"
      />
      <InboundEtaFeed className="mb-6" />
      <Query result={result} skeleton={<ListSkeleton rows={6} />}>
        {({ rows, reference }) => {
          if (rows.length === 0) {
            return (
              <Card className="p-0 ring-0">
                <EmptyState title="No turnarounds scheduled" />
              </Card>
            );
          }
          return (
            <Card className="p-0 ring-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flights</TableHead>
                    <TableHead className="hidden sm:table-cell">Aircraft</TableHead>
                    <TableHead>Landing</TableHead>
                    <TableHead className="hidden md:table-cell">On block</TableHead>
                    <TableHead className="hidden md:table-cell">Target off</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ turnaround, rotation, flights }) => {
                    const state = turnaroundState(turnaround);
                    const progress = turnaroundProgress(turnaround);
                    const aircraft = rotation
                      ? reference.aircraft.get(rotation.aircraft_id)
                      : undefined;
                    return (
                      <TableRow key={turnaround.rotation_id}>
                        <TableCell>
                          <Link
                            href={`/ground/turnaround/${turnaround.rotation_id}`}
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {flights.map((f) => f.flight_no).join(" · ") ||
                              `Rotation #${turnaround.rotation_id}`}
                          </Link>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {aircraft?.registration ?? "—"}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {(() => {
                            if (turnaround.aldt)
                              return (
                                <span className="text-muted-foreground">
                                  Landed {formatTime(turnaround.aldt)}
                                </span>
                              );
                            const item = etas.get(turnaround.rotation_id);
                            const short = item ? etaShort(item) : null;
                            if (short)
                              return <span className="font-medium text-primary">{short}</span>;
                            return (
                              <span className="text-muted-foreground">
                                {turnaround.predicted_aldt
                                  ? `~${formatTime(turnaround.predicted_aldt)}`
                                  : "—"}
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="hidden tabular-nums text-muted-foreground md:table-cell">
                          {formatTime(turnaround.aibt)}
                        </TableCell>
                        <TableCell className="hidden tabular-nums text-muted-foreground md:table-cell">
                          {formatTime(turnaround.tobt)}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={state} showDot />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-status-neutral-soft">
                              <div
                                className="h-full rounded-full bg-status-ok"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {progress}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          );
        }}
      </Query>
    </div>
  );
}
