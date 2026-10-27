"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plane,
  Receipt,
  ShieldCheck,
  Users,
} from "lucide-react";

import { loadManageView } from "@/lib/data";
import { useAsync } from "@/lib/use-async";
import { useSession } from "@/lib/use-session";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/format";
import type { Airport } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Query } from "@/components/async/query";
import { ListSkeleton } from "@/components/async/states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CrudManager } from "./crud-manager";
import { FlightForm } from "./flight-form";
import { AirportsBrowser } from "./airports-browser";
import { AirlineForm } from "./airline-form";
import { AircraftForm } from "./aircraft-form";
import { AircraftTypeForm } from "./aircraft-type-form";
import { TerminalForm } from "./terminal-form";
import { GateForm } from "./gate-form";
import { GateAssignmentForm } from "./gate-assignment-form";
import { StaffForm } from "./staff-form";
import { ShiftForm } from "./shift-form";
import { StaffAssignmentForm } from "./staff-assignment-form";
import { ChargeForm } from "./charge-form";
import { RoleForm } from "./role-form";
import { UserForm } from "./user-form";
import { PassengerForm } from "./passenger-form";
import { BookingForm } from "./booking-form";

function airportDisplay(
  airports: Map<number, Airport>,
  id: number
): React.ReactNode {
  const airport = airports.get(id);
  if (!airport) return `#${id}`;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant="outline">{airport.iata}</Badge>
      <span className="truncate">{airport.name}</span>
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function ManageView() {
  const router = useRouter();
  const session = useSession();
  const result = useAsync("manage", loadManageView, 30_000);
  const canManage = session?.role === "admin" || session?.role === "ops";

  React.useEffect(() => {
    if (session && !canManage) router.replace("/ground");
  }, [canManage, router, session]);

  if (!canManage) return null;

  return (
    <div>
      <PageHeader
        title="Manage operations"
        description="Create, edit and remove every record behind the dashboard."
      />
      <Query result={result} skeleton={<ListSkeleton rows={6} />}>
        {({
          flights,
          airports,
          reference,
          terminals,
          rotations,
          gateAssignments,
          optimizationRuns,
          staff,
          shifts,
          staffAssignments,
          roles,
          users,
          passengers,
          bookings,
          charges,
        }) => {
          const terminalById = new Map(terminals.map((t) => [t.id, t]));
          const staffById = new Map(staff.map((s) => [s.id, s]));
          const shiftById = new Map(shifts.map((s) => [s.id, s]));
          const roleById = new Map(roles.map((r) => [r.id, r]));
          const flightById = new Map(flights.map((f) => [f.id, f]));
          const passengerById = new Map(passengers.map((p) => [p.id, p]));

          return (
            <Tabs defaultValue="flights" className="flex flex-col gap-6">
              <div className="overflow-x-auto">
              <TabsList>
                <TabsTrigger value="flights">
                  <Plane />
                  Flights ({flights.length})
                </TabsTrigger>
                <TabsTrigger value="airports">
                  <Building2 />
                  Airports
                </TabsTrigger>
                <TabsTrigger value="fleet">
                  <Plane />
                  Fleet
                </TabsTrigger>
                <TabsTrigger value="apron">
                  <Building2 />
                  Apron
                </TabsTrigger>
                <TabsTrigger value="crew">
                  <Users />
                  Crew
                </TabsTrigger>
                <TabsTrigger value="commercial">
                  <Receipt />
                  Commercial
                </TabsTrigger>
                <TabsTrigger value="access">
                  <ShieldCheck />
                  Access
                </TabsTrigger>
              </TabsList>
              </div>

              <TabsContent value="flights">
                <CrudManager
                  rows={flights}
                  canManage
                  searchPlaceholder="Search flights…"
                  searchText={(flight) =>
                    `${flight.flight_no} ${flight.status} ${flight.direction} ${
                      airports.get(flight.origin_id)?.iata ?? ""
                    } ${airports.get(flight.dest_id)?.iata ?? ""}`
                  }
                  createLabel="New flight"
                  emptyTitle="No seeded flights"
                  emptyHint="Seeded flights will appear here."
                  deleteTitle={(flight) => `Delete ${flight.flight_no}`}
                  deleteDescription={() =>
                    "This permanently removes the selected flight."
                  }
                  onDelete={(flight) => api.deleteFlight(flight.id)}
                  onChanged={result.reload}
                  renderForm={({ open, item, onOpenChange, onSaved }) => (
                    <FlightForm
                      open={open}
                      item={item}
                      onOpenChange={onOpenChange}
                      onSaved={onSaved}
                      airlines={Array.from(reference.airlines.values())}
                      aircraft={Array.from(reference.aircraft.values())}
                      aircraftTypes={Array.from(reference.aircraftTypes.values())}
                      airports={airports}
                    />
                  )}
                  columns={[
                    {
                      header: "Flight",
                      cell: (flight) => (
                        <div className="flex flex-col">
                          <span className="font-medium">{flight.flight_no}</span>
                          <span className="text-sm text-muted-foreground">
                            {flight.direction} · {flight.status}
                          </span>
                        </div>
                      ),
                    },
                    {
                      header: "Origin",
                      cell: (flight) => airportDisplay(airports, flight.origin_id),
                    },
                    {
                      header: "Destination",
                      cell: (flight) =>
                        airportDisplay(airports, flight.dest_id),
                    },
                    {
                      header: "Scheduled",
                      cell: (flight) => (
                        <time dateTime={flight.sched_time}>
                          {formatTime(flight.sched_time)}
                        </time>
                      ),
                    },
                  ]}
                />
              </TabsContent>

              <TabsContent value="airports">
                <AirportsBrowser onChanged={result.reload} />
              </TabsContent>

              <TabsContent value="fleet" className="flex flex-col gap-8">
                <Section title="Airlines">
                  <CrudManager
                    rows={Array.from(reference.airlines.values())}
                    canManage
                    searchPlaceholder="Search airlines…"
                    searchText={(a) => `${a.iata} ${a.name}`}
                    createLabel="New airline"
                    emptyTitle="No airlines yet"
                    deleteTitle={(a) => `Delete ${a.name}`}
                    onDelete={(a) => api.deleteAirline(a.id)}
                    onChanged={result.reload}
                    renderForm={({ open, item, onOpenChange, onSaved }) => (
                      <AirlineForm
                        open={open}
                        item={item}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                      />
                    )}
                    columns={[
                      { header: "IATA", cell: (a) => a.iata },
                      { header: "Name", cell: (a) => a.name },
                    ]}
                  />
                </Section>

                <Section title="Aircraft">
                  <CrudManager
                    rows={Array.from(reference.aircraft.values())}
                    canManage
                    searchPlaceholder="Search aircraft…"
                    searchText={(a) => a.registration}
                    createLabel="New aircraft"
                    emptyTitle="No aircraft yet"
                    deleteTitle={(a) => `Delete ${a.registration}`}
                    onDelete={(a) => api.deleteAircraft(a.id)}
                    onChanged={result.reload}
                    renderForm={({ open, item, onOpenChange, onSaved }) => (
                      <AircraftForm
                        open={open}
                        item={item}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                        airlines={Array.from(reference.airlines.values())}
                        types={Array.from(reference.aircraftTypes.values())}
                      />
                    )}
                    columns={[
                      { header: "Registration", cell: (a) => a.registration },
                      {
                        header: "Airline",
                        cell: (a) =>
                          reference.airlines.get(a.airline_id)?.iata ?? "—",
                      },
                      {
                        header: "Type",
                        cell: (a) =>
                          reference.aircraftTypes.get(a.type_id)?.icao_code ?? "—",
                      },
                    ]}
                  />
                </Section>

                <Section title="Aircraft types">
                  <CrudManager
                    rows={Array.from(reference.aircraftTypes.values())}
                    canManage
                    searchPlaceholder="Search types…"
                    searchText={(t) => t.icao_code}
                    createLabel="New type"
                    entityLabel="aircraft type"
                    emptyTitle="No aircraft types yet"
                    deleteTitle={(t) => `Delete ${t.icao_code}`}
                    onDelete={(t) => api.deleteAircraftType(t.id)}
                    onChanged={result.reload}
                    renderForm={({ open, item, onOpenChange, onSaved }) => (
                      <AircraftTypeForm
                        open={open}
                        item={item}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                      />
                    )}
                    columns={[
                      { header: "ICAO", cell: (t) => t.icao_code },
                      { header: "Size", cell: (t) => t.size },
                      { header: "Seats", cell: (t) => t.seats },
                      { header: "Typical turn", cell: (t) => `${t.typical_turn_min}m` },
                    ]}
                  />
                </Section>
              </TabsContent>

              <TabsContent value="apron" className="flex flex-col gap-8">
                <Section title="Terminals">
                  <CrudManager
                    rows={terminals}
                    canManage
                    searchPlaceholder="Search terminals…"
                    searchText={(t) => t.code}
                    createLabel="New terminal"
                    emptyTitle="No terminals yet"
                    deleteTitle={(t) => `Delete ${t.code}`}
                    onDelete={(t) => api.deleteTerminal(t.id)}
                    onChanged={result.reload}
                    renderForm={({ open, item, onOpenChange, onSaved }) => (
                      <TerminalForm
                        open={open}
                        item={item}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                        airports={airports}
                      />
                    )}
                    columns={[
                      { header: "Code", cell: (t) => t.code },
                      {
                        header: "Airport",
                        cell: (t) => airportDisplay(airports, t.airport_id),
                      },
                    ]}
                  />
                </Section>

                <Section title="Gates">
                  <CrudManager
                    rows={Array.from(reference.gates.values())}
                    canManage
                    searchPlaceholder="Search gates…"
                    searchText={(g) => g.code}
                    createLabel="New gate"
                    emptyTitle="No gates yet"
                    deleteTitle={(g) => `Delete gate ${g.code}`}
                    onDelete={(g) => api.deleteGate(g.id)}
                    onChanged={result.reload}
                    renderForm={({ open, item, onOpenChange, onSaved }) => (
                      <GateForm
                        open={open}
                        item={item}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                        terminals={terminals}
                      />
                    )}
                    columns={[
                      { header: "Code", cell: (g) => g.code },
                      {
                        header: "Terminal",
                        cell: (g) => terminalById.get(g.terminal_id)?.code ?? "—",
                      },
                      { header: "Kind", cell: (g) => g.kind },
                      { header: "Status", cell: (g) => g.status },
                    ]}
                  />
                </Section>

                <Section title="Gate assignments">
                  <CrudManager
                    rows={gateAssignments}
                    canManage
                    searchPlaceholder="Search assignments…"
                    searchText={(a) =>
                      `${reference.gates.get(a.gate_id)?.code ?? ""} rotation-${a.rotation_id}`
                    }
                    createLabel="Assign a gate"
                    emptyTitle="No gate assignments yet"
                    emptyHint="Assign a rotation to a gate to see it here and on the turnaround board."
                    deleteTitle={() => "Remove gate assignment"}
                    onDelete={(a) => api.deleteGateAssignment(a.id)}
                    onChanged={result.reload}
                    renderForm={({ open, item, onOpenChange, onSaved }) => (
                      <GateAssignmentForm
                        open={open}
                        item={item}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                        rotations={rotations}
                        gates={Array.from(reference.gates.values())}
                        aircraft={reference.aircraft}
                        optimizationRuns={optimizationRuns}
                        requestedBy={session?.id ?? 0}
                      />
                    )}
                    columns={[
                      {
                        header: "Rotation",
                        cell: (a) => `#${a.rotation_id}`,
                      },
                      {
                        header: "Gate",
                        cell: (a) => reference.gates.get(a.gate_id)?.code ?? "—",
                      },
                      { header: "Source", cell: (a) => a.source },
                      {
                        header: "Window",
                        cell: (a) =>
                          `${formatTime(a.start)}–${formatTime(a.end)}`,
                      },
                    ]}
                  />
                </Section>
              </TabsContent>

              <TabsContent value="crew" className="flex flex-col gap-8">
                <Section title="Staff">
                  <CrudManager
                    rows={staff}
                    canManage
                    searchPlaceholder="Search staff…"
                    searchText={(s) => `${s.name} ${s.skill}`}
                    createLabel="New staff member"
                    emptyTitle="No staff yet"
                    deleteTitle={(s) => `Delete ${s.name}`}
                    onDelete={(s) => api.deleteStaff(s.id)}
                    onChanged={result.reload}
                    renderForm={({ open, item, onOpenChange, onSaved }) => (
                      <StaffForm
                        open={open}
                        item={item}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                        users={users}
                      />
                    )}
                    columns={[
                      { header: "Name", cell: (s) => s.name },
                      { header: "Skill", cell: (s) => s.skill },
                    ]}
                  />
                </Section>

                <Section title="Shifts">
                  <CrudManager
                    rows={shifts}
                    canManage
                    searchPlaceholder="Search shifts…"
                    searchText={(s) => staffById.get(s.staff_id)?.name ?? ""}
                    createLabel="New shift"
                    emptyTitle="No shifts yet"
                    deleteTitle={() => "Delete shift"}
                    onDelete={(s) => api.deleteShift(s.id)}
                    onChanged={result.reload}
                    renderForm={({ open, item, onOpenChange, onSaved }) => (
                      <ShiftForm
                        open={open}
                        item={item}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                        staff={staff}
                      />
                    )}
                    columns={[
                      {
                        header: "Staff",
                        cell: (s) => staffById.get(s.staff_id)?.name ?? `#${s.staff_id}`,
                      },
                      {
                        header: "Window",
                        cell: (s) => `${formatTime(s.start)}–${formatTime(s.end)}`,
                      },
                    ]}
                  />
                </Section>

                <Section title="Staff assignments">
                  <CrudManager
                    rows={staffAssignments}
                    canManage
                    searchPlaceholder="Search assignments…"
                    searchText={(a) => a.task}
                    createLabel="New assignment"
                    emptyTitle="No assignments yet"
                    deleteTitle={() => "Delete assignment"}
                    onDelete={(a) => api.deleteStaffAssignment(a.id)}
                    onChanged={result.reload}
                    renderForm={({ open, item, onOpenChange, onSaved }) => (
                      <StaffAssignmentForm
                        open={open}
                        item={item}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                        shifts={shifts}
                        staff={staff}
                        rotations={rotations}
                      />
                    )}
                    columns={[
                      {
                        header: "Staff",
                        cell: (a) => {
                          const shift = shiftById.get(a.shift_id);
                          return shift
                            ? (staffById.get(shift.staff_id)?.name ?? `Shift #${a.shift_id}`)
                            : `Shift #${a.shift_id}`;
                        },
                      },
                      { header: "Rotation", cell: (a) => `#${a.rotation_id}` },
                      { header: "Task", cell: (a) => a.task.replace(/_/g, " ") },
                    ]}
                  />
                </Section>
              </TabsContent>

              <TabsContent value="commercial" className="flex flex-col gap-8">
                <Section title="Charges">
                  <CrudManager
                    rows={charges}
                    canManage
                    searchPlaceholder="Search charges…"
                    searchText={(c) => c.kind}
                    createLabel="New charge"
                    emptyTitle="No charges yet"
                    deleteTitle={() => "Delete charge"}
                    onDelete={(c) => api.deleteCharge(c.id)}
                    onChanged={result.reload}
                    renderForm={({ open, item, onOpenChange, onSaved }) => (
                      <ChargeForm
                        open={open}
                        item={item}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                        flights={flights}
                      />
                    )}
                    columns={[
                      {
                        header: "Flight",
                        cell: (c) =>
                          flightById.get(c.flight_id)?.flight_no ?? `#${c.flight_id}`,
                      },
                      { header: "Kind", cell: (c) => c.kind.replace(/_/g, " ") },
                      {
                        header: "Amount",
                        cell: (c) =>
                          `${(c.amount_minor / 100).toFixed(2)} ${c.currency}`,
                      },
                    ]}
                  />
                </Section>

                <Section title="Passengers">
                  <CrudManager
                    rows={passengers}
                    canManage
                    searchPlaceholder="Search passengers…"
                    searchText={(p) => `${p.name} ${p.nationality}`}
                    createLabel="New passenger"
                    emptyTitle="No passengers yet"
                    deleteTitle={(p) => `Delete ${p.name}`}
                    onDelete={(p) => api.deletePassenger(p.id)}
                    onChanged={result.reload}
                    renderForm={({ open, item, onOpenChange, onSaved }) => (
                      <PassengerForm
                        open={open}
                        item={item}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                      />
                    )}
                    columns={[
                      { header: "Name", cell: (p) => p.name },
                      { header: "Nationality", cell: (p) => p.nationality },
                    ]}
                  />
                </Section>

                <Section title="Bookings">
                  <CrudManager
                    rows={bookings}
                    canManage
                    searchPlaceholder="Search bookings…"
                    searchText={(b) =>
                      `${passengerById.get(b.passenger_id)?.name ?? ""} ${b.seat}`
                    }
                    createLabel="New booking"
                    emptyTitle="No bookings yet"
                    deleteTitle={() => "Delete booking"}
                    onDelete={(b) => api.deleteBooking(b.id)}
                    onChanged={result.reload}
                    renderForm={({ open, item, onOpenChange, onSaved }) => (
                      <BookingForm
                        open={open}
                        item={item}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                        flights={flights}
                        passengers={passengers}
                      />
                    )}
                    columns={[
                      {
                        header: "Flight",
                        cell: (b) =>
                          flightById.get(b.flight_id)?.flight_no ?? `#${b.flight_id}`,
                      },
                      {
                        header: "Passenger",
                        cell: (b) =>
                          passengerById.get(b.passenger_id)?.name ?? `#${b.passenger_id}`,
                      },
                      { header: "Seat", cell: (b) => b.seat },
                    ]}
                  />
                </Section>
              </TabsContent>

              <TabsContent value="access" className="flex flex-col gap-8">
                <Section title="Roles">
                  <CrudManager
                    rows={roles}
                    canManage
                    searchPlaceholder="Search roles…"
                    searchText={(r) => r.name}
                    createLabel="New role"
                    emptyTitle="No roles yet"
                    deleteTitle={(r) => `Delete ${r.name}`}
                    onDelete={(r) => api.deleteRole(r.id)}
                    onChanged={result.reload}
                    renderForm={({ open, item, onOpenChange, onSaved }) => (
                      <RoleForm
                        open={open}
                        item={item}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                      />
                    )}
                    columns={[{ header: "Name", cell: (r) => r.name }]}
                  />
                </Section>

                <Section title="Users">
                  <CrudManager
                    rows={users}
                    canManage
                    canCreate={false}
                    searchPlaceholder="Search users…"
                    searchText={(u) => u.email}
                    createLabel="New user"
                    emptyTitle="No users yet"
                    deleteTitle={() => "Delete user"}
                    onDelete={() => Promise.reject(new Error("Users cannot be deleted here — deactivate them instead."))}
                    onChanged={result.reload}
                    renderForm={({ open, item, onOpenChange, onSaved }) => (
                      <UserForm
                        open={open}
                        item={item}
                        onOpenChange={onOpenChange}
                        onSaved={onSaved}
                        roles={roles}
                        airlines={Array.from(reference.airlines.values())}
                      />
                    )}
                    columns={[
                      { header: "Email", cell: (u) => u.email },
                      {
                        header: "Role",
                        cell: (u) => roleById.get(u.role_id)?.name ?? `#${u.role_id}`,
                      },
                      {
                        header: "Airline",
                        cell: (u) =>
                          reference.airlines.get(u.airline_id)?.iata ?? "—",
                      },
                      {
                        header: "Access",
                        cell: (u) => (
                          <Badge variant={u.is_active ? "default" : "outline"}>
                            {u.is_active ? "Active" : "Inactive"}
                          </Badge>
                        ),
                      },
                    ]}
                  />
                </Section>
              </TabsContent>
            </Tabs>
          );
        }}
      </Query>
    </div>
  );
}
