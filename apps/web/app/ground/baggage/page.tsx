"use client";

import { loadBaggageView } from "@/lib/data";
import { formatTime, relativeLabel } from "@/lib/format";
import { useAsync } from "@/lib/use-async";
import { PageHeader } from "@/components/layout/page-header";
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

export default function BaggagePage() {
  const result = useAsync("baggage", loadBaggageView);

  return (
    <div>
      <PageHeader
        title="Baggage"
        description="Tagged bags with last scan and location"
      />
      <Query result={result} skeleton={<ListSkeleton rows={8} />}>
        {({ baggage }) => {
          if (baggage.length === 0) {
            return (
              <Card className="p-0 ring-0">
                <EmptyState title="No baggage records" />
              </Card>
            );
          }
          return (
            <Card className="p-0 ring-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Flight</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>Last location</TableHead>
                    <TableHead>Last scanned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {baggage.map((bag) => (
                    <TableRow key={bag.id}>
                      <TableCell className="font-medium">{bag.tag}</TableCell>
                      <TableCell>{bag.passenger_name ?? "—"}</TableCell>
                      <TableCell>{bag.flight_no ?? `#${bag.flight_id}`}</TableCell>
                      <TableCell className="tabular-nums">{bag.weight_kg}</TableCell>
                      <TableCell>{bag.last_location ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {bag.last_scanned_at
                          ? `${formatTime(bag.last_scanned_at)} · ${relativeLabel(
                              bag.last_scanned_at
                            )}`
                          : "—"}
                      </TableCell>
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
