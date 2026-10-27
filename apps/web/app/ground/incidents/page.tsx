"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Loader2, Plus, TriangleAlert } from "lucide-react";

import { api } from "@/lib/api";
import { loadIncidentsView } from "@/lib/data";
import { formatTime, relativeLabel } from "@/lib/format";
import { severityMeta } from "@/lib/status";
import { useAsync } from "@/lib/use-async";
import { useSession } from "@/lib/use-session";
import { useToast } from "@/components/toast/toast-provider";
import { PageHeader } from "@/components/layout/page-header";
import { StatusChip, StatusDot } from "@/components/status/status-chip";
import { Query } from "@/components/async/query";
import { EmptyState, ListSkeleton } from "@/components/async/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function severityChip(severity: number) {
  const meta = severityMeta(severity);
  return <StatusChip status="severity" label={meta.label} tone={meta.tone} />;
}

const OPEN_STATUSES = ["open", "investigating"];

export default function IncidentsPage() {
  const session = useSession();
  const { toast } = useToast();
  const canResolve =
    session?.role === "ground" || session?.role === "ops" || session?.role === "admin";
  const result = useAsync("incidents", loadIncidentsView);
  const [resolvingId, setResolvingId] = React.useState<number | null>(null);

  async function resolve(id: number) {
    setResolvingId(id);
    try {
      await api.updateIncident(id, { status: "closed" });
      toast({ variant: "success", title: `Incident #${id} resolved` });
      result.reload();
    } catch (err) {
      toast({
        variant: "error",
        title: "Couldn't resolve incident",
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Incidents"
        description="All reported ground incidents"
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

      <Query result={result} skeleton={<ListSkeleton rows={8} />}>
        {({ rows }) => {
          if (rows.length === 0) {
            return (
              <Card className="p-0 ring-0">
                <EmptyState
                  title="No incidents"
                  icon={TriangleAlert}
                  hint="Great — nothing to report."
                />
              </Card>
            );
          }
          return (
            <Card className="p-0 ring-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Flight</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Closed</TableHead>
                    {canResolve && <TableHead className="w-28 text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ incident, flight }) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-medium">#{incident.id}</TableCell>
                      <TableCell>{flight?.flight_no ?? `#${incident.flight_id}`}</TableCell>
                      <TableCell className="capitalize">
                        {incident.category.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell>{severityChip(incident.severity)}</TableCell>
                      <TableCell className="flex items-center gap-1.5">
                        <StatusDot status={incident.status} />
                        <span className="capitalize">{incident.status}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatTime(incident.created_at)} ·{" "}
                        {relativeLabel(incident.created_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {incident.closed_at
                          ? `${formatTime(incident.closed_at)} · ${relativeLabel(
                              incident.closed_at
                            )}`
                          : "—"}
                      </TableCell>
                      {canResolve && (
                        <TableCell className="text-right">
                          {OPEN_STATUSES.includes(incident.status) ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={resolvingId === incident.id}
                              onClick={() => resolve(incident.id)}
                            >
                              {resolvingId === incident.id ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <Check />
                              )}
                              Resolve
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Resolved</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          );
        }}
      </Query>
    </div>
  );
}
