"use client";

import { loadScheduleView } from "@/lib/data";
import { formatDate, formatDay, formatTime, relativeLabel } from "@/lib/format";
import { useAsync } from "@/lib/use-async";
import { useSession } from "@/lib/use-session";
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

export default function SchedulePage() {
  const session = useSession();
  const userId = session?.id ?? 0;
  const result = useAsync(`schedule:${userId}`, () => loadScheduleView(userId));

  return (
    <div>
      <PageHeader title="My schedule" description="Shifts and assigned tasks" />
      <Query result={result} skeleton={<ListSkeleton rows={8} />}>
        {({ staff, shifts, assignments, flightsByRotation }) => {
          if (shifts.length === 0) {
            return (
              <Card className="p-0 ring-0">
                <EmptyState
                  title="No shifts found"
                  hint="If you expect shifts, ask ops to roster you."
                />
              </Card>
            );
          }
          return (
            <>
              <Card className="ring-0">
                <div className="flex flex-col gap-2 p-5">
                  <div className="text-sm font-medium">
                    {staff?.name ?? session?.name ?? "You"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {staff?.skill ?? "Ground"} · {assignments.length} tasks
                  </div>
                </div>
              </Card>

              <div className="mt-6 grid gap-6">
                {shifts.map((shift) => {
                  const tasks = assignments.filter((a) => a.shift_id === shift.id);
                  return (
                    <Card key={shift.id} className="p-0 ring-0">
                      <div className="flex items-center justify-between px-5 py-4">
                        <div>
                          <div className="text-sm font-medium">
                            {formatDay(shift.start)} · {formatDate(shift.start)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatTime(shift.start)} – {formatTime(shift.end)}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {relativeLabel(shift.start)} / {relativeLabel(shift.end)}
                        </div>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Rotation</TableHead>
                            <TableHead>Flights</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasks.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                                No tasks assigned to this shift.
                              </TableCell>
                            </TableRow>
                          ) : (
                            tasks.map((assignment) => {
                              const flights = flightsByRotation.get(
                                assignment.rotation_id
                              );
                              return (
                                <TableRow key={assignment.id}>
                                  <TableCell className="capitalize">
                                    {assignment.task.replace(/_/g, " ")}
                                  </TableCell>
                                  <TableCell className="tabular-nums">
                                    #{assignment.rotation_id}
                                  </TableCell>
                                  <TableCell>
                                    {flights && flights.length > 0
                                      ? flights.map((f) => f.flight_no).join(", ")
                                      : "—"}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  );
                })}
              </div>
            </>
          );
        }}
      </Query>
    </div>
  );
}
