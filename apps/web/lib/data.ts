import { api } from "./api";
import { indexBy } from "./derive";
import type {
  Aircraft,
  AircraftType,
  Airline,
  Airport,
  AppUser,
  Baggage,
  Booking,
  Charge,
  DelayPrediction,
  Flight,
  FlightEvent,
  Gate,
  GateAssignment,
  Incident,
  OptimizationRun,
  Passenger,
  RoleRecord,
  Rotation,
  Shift,
  Staff,
  StaffAssignment,
  Terminal,
  Turnaround,
} from "./types";

/** Small, slow-changing tables fetched once per page. */
export interface Reference {
  airlines: Map<number, Airline>;
  aircraft: Map<number, Aircraft>;
  aircraftTypes: Map<number, AircraftType>;
  gates: Map<number, Gate>;
}

export async function loadReference(): Promise<Reference> {
  const [airlines, aircraft, aircraftTypes, gates] = await Promise.all([
    api.listAirlines(),
    api.listAircraft(),
    api.listAircraftTypes(),
    api.listGates(),
  ]);
  return {
    airlines: indexBy(airlines, (a) => a.id),
    aircraft: indexBy(aircraft, (a) => a.id),
    aircraftTypes: indexBy(aircraftTypes, (t) => t.id),
    gates: indexBy(gates, (g) => g.id),
  };
}

/** Airports are fetched by id — the reference table has thousands of rows. */
export async function loadAirports(ids: number[]): Promise<Map<number, Airport>> {
  const unique = [...new Set(ids)].filter((id) => Number.isFinite(id) && id > 0);
  const airports = await Promise.all(unique.map((id) => api.getAirport(id)));
  return indexBy(airports, (a) => a.id);
}

function airportIds(flights: Flight[]): number[] {
  return flights.flatMap((f) => [f.origin_id, f.dest_id]);
}

/* --------------------------------- flights -------------------------------- */

export interface FlightsView {
  flights: Flight[];
  reference: Reference;
  airports: Map<number, Airport>;
}

export async function loadFlightsView(): Promise<FlightsView> {
  const [flights, reference] = await Promise.all([
    api.listFlights(),
    loadReference(),
  ]);
  const airports = await loadAirports(airportIds(flights));
  return { flights, reference, airports };
}

export interface FlightDetailView {
  flight: Flight;
  reference: Reference;
  airports: Map<number, Airport>;
  turnaround: Turnaround | undefined;
  rotation: Rotation | undefined;
  events: FlightEvent[];
  delayPrediction: DelayPrediction | undefined;
}

export async function loadFlightDetail(id: number): Promise<FlightDetailView> {
  const [flight, reference, turnarounds, rotations, events, predictions] =
    await Promise.all([
      api.getFlight(id),
      loadReference(),
      api.listTurnarounds(),
      api.listRotations(),
      api.listFlightEvents(id),
      api.listDelayPredictions(id),
    ]);
  const airports = await loadAirports([flight.origin_id, flight.dest_id]);
  return {
    flight,
    reference,
    airports,
    turnaround: turnarounds.find((t) => t.rotation_id === flight.rotation_id),
    rotation: rotations.find((r) => r.id === flight.rotation_id),
    events,
    delayPrediction: predictions.at(-1),
  };
}

/* ------------------------------- turnarounds ------------------------------ */

export interface TurnaroundRow {
  turnaround: Turnaround;
  rotation: Rotation | undefined;
  flights: Flight[];
}

export interface TurnaroundsView {
  rows: TurnaroundRow[];
  reference: Reference;
  airports: Map<number, Airport>;
}

async function buildTurnaroundRows(): Promise<{
  rows: TurnaroundRow[];
  reference: Reference;
  airports: Map<number, Airport>;
  rotations: Rotation[];
  flights: Flight[];
}> {
  const [turnarounds, rotations, flights, reference] = await Promise.all([
    api.listTurnarounds(),
    api.listRotations(),
    api.listFlights(),
    loadReference(),
  ]);
  const rotationMap = indexBy(rotations, (r) => r.id);
  const rows = turnarounds.map((turnaround) => ({
    turnaround,
    rotation: rotationMap.get(turnaround.rotation_id),
    flights: flights.filter((f) => f.rotation_id === turnaround.rotation_id),
  }));
  const airports = await loadAirports(airportIds(flights));
  return { rows, reference, airports, rotations, flights };
}

export async function loadTurnaroundsView(): Promise<TurnaroundsView> {
  const { rows, reference, airports } = await buildTurnaroundRows();
  return { rows, reference, airports };
}

export interface TurnaroundDetailView extends TurnaroundsView {
  row: TurnaroundRow | undefined;
  assignments: StaffAssignment[];
  /** Shift id → the crew member working it. */
  staffByShift: Map<number, Staff>;
  gateAssignment: GateAssignment | undefined;
  gateAssignments: GateAssignment[];
  rotations: Rotation[];
  optimizationRuns: OptimizationRun[];
}

export async function loadTurnaroundDetail(
  rotationId: number
): Promise<TurnaroundDetailView> {
  const [
    { rows, reference, airports, rotations },
    assignments,
    staff,
    shifts,
    gateAssignments,
    optimizationRuns,
  ] = await Promise.all([
    buildTurnaroundRows(),
    api.listStaffAssignments(),
    api.listStaff(),
    api.listShifts(),
    api.listGateAssignments(),
    api.listOptimizationRuns(),
  ]);
  const staffById = indexBy(staff, (s) => s.id);
  const staffByShift = new Map<number, Staff>();
  for (const shift of shifts) {
    const member = staffById.get(shift.staff_id);
    if (member) staffByShift.set(shift.id, member);
  }
  return {
    rows,
    row: rows.find((r) => r.turnaround.rotation_id === rotationId),
    reference,
    airports,
    assignments: assignments.filter((a) => a.rotation_id === rotationId),
    staffByShift,
    gateAssignment: gateAssignments.find(
      (a) => a.rotation_id === rotationId && a.is_active
    ),
    gateAssignments,
    rotations,
    optimizationRuns,
  };
}

/* --------------------------------- baggage -------------------------------- */

export interface BaggageView {
  baggage: Baggage[];
  reference: Reference;
}

export async function loadBaggageView(): Promise<BaggageView> {
  const [baggage, reference] = await Promise.all([
    api.listBaggage(),
    loadReference(),
  ]);
  return { baggage, reference };
}

/* -------------------------------- incidents ------------------------------- */

export interface IncidentRow {
  incident: Incident;
  flight: Flight | undefined;
}

export interface IncidentsView {
  rows: IncidentRow[];
  reference: Reference;
  airports: Map<number, Airport>;
}

export async function loadIncidentsView(): Promise<IncidentsView> {
  const [incidents, flights, reference] = await Promise.all([
    api.listIncidents(),
    api.listFlights(),
    loadReference(),
  ]);
  const flightMap = indexBy(flights, (f) => f.id);
  const rows = incidents.map((incident) => ({
    incident,
    flight: flightMap.get(incident.flight_id),
  }));
  const airports = await loadAirports(airportIds(flights));
  return { rows, reference, airports };
}

/* -------------------------------- schedule -------------------------------- */

export interface ScheduleView {
  staff: Staff | undefined;
  shifts: Shift[];
  assignments: StaffAssignment[];
  rotations: Map<number, Rotation>;
  flightsByRotation: Map<number, Flight[]>;
  reference: Reference;
}

export async function loadScheduleView(userId: number): Promise<ScheduleView> {
  const [staff, shifts, assignments, rotations, flights, reference] =
    await Promise.all([
      api.listStaff(),
      api.listShifts(),
      api.listStaffAssignments(),
      api.listRotations(),
      api.listFlights(),
      loadReference(),
    ]);
  const me = staff.find((member) => member.user_id === userId);
  const shiftsForMe = me ? shifts.filter((s) => s.staff_id === me.id) : [];
  const shiftIds = new Set(shiftsForMe.map((s) => s.id));
  const flightsByRotation = new Map<number, Flight[]>();
  for (const flight of flights) {
    const list = flightsByRotation.get(flight.rotation_id) ?? [];
    list.push(flight);
    flightsByRotation.set(flight.rotation_id, list);
  }
  return {
    staff: me,
    shifts: shiftsForMe,
    assignments: assignments.filter((a) => shiftIds.has(a.shift_id)),
    rotations: indexBy(rotations, (r) => r.id),
    flightsByRotation,
    reference,
  };
}

/* -------------------------------- dashboard ------------------------------- */

export interface GroundDashboardView {
  flights: Flight[];
  turnarounds: Turnaround[];
  incidents: Incident[];
  reference: Reference;
  airports: Map<number, Airport>;
  schedule: ScheduleView;
  gateAssignments: GateAssignment[];
}

export async function loadGroundDashboard(
  userId: number
): Promise<GroundDashboardView> {
  const [flights, turnarounds, incidents, reference, schedule, gateAssignments] =
    await Promise.all([
      api.listFlights(),
      api.listTurnarounds(),
      api.listIncidents(),
      loadReference(),
      loadScheduleView(userId),
      api.listGateAssignments(),
    ]);
  const airports = await loadAirports(airportIds(flights));
  return {
    flights,
    turnarounds,
    incidents,
    reference,
    airports,
    schedule,
    gateAssignments,
  };
}

/* --------------------------------- manage --------------------------------- */

export interface ManageView {
  flights: Flight[];
  airports: Map<number, Airport>;
  reference: Reference;
  terminals: Terminal[];
  rotations: Rotation[];
  gateAssignments: GateAssignment[];
  optimizationRuns: OptimizationRun[];
  staff: Staff[];
  shifts: Shift[];
  staffAssignments: StaffAssignment[];
  roles: RoleRecord[];
  users: AppUser[];
  passengers: Passenger[];
  bookings: Booking[];
  charges: Charge[];
}

export async function loadManageView(): Promise<ManageView> {
  const [
    flights,
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
  ] = await Promise.all([
    api.listFlights({ offset: 0, limit: 50 }),
    loadReference(),
    api.listTerminals(),
    api.listRotations(),
    api.listGateAssignments(),
    api.listOptimizationRuns(),
    api.listStaff(),
    api.listShifts(),
    api.listStaffAssignments(),
    api.listRoles(),
    api.listUsers(),
    api.listPassengers(),
    api.listBookings(),
    api.listCharges(),
  ]);
  const airports = await loadAirports(airportIds(flights));
  return {
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
  };
}

export interface AirlineDashboardView {
  flights: Flight[];
  reference: Reference;
  airports: Map<number, Airport>;
  airline: Airline | undefined;
}

export async function loadAirlineDashboard(
  airlineId: number
): Promise<AirlineDashboardView> {
  const [flights, reference] = await Promise.all([
    api.listFlights(),
    loadReference(),
  ]);
  const airports = await loadAirports(airportIds(flights));
  return {
    flights,
    reference,
    airports,
    airline: reference.airlines.get(airlineId),
  };
}
