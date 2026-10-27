import { API_URL, getToken } from "./auth";
import { API_ROUTES } from "./routes";
import type {
  ActivityLogEntry,
  Aircraft,
  AircraftInput,
  AircraftType,
  AircraftTypeInput,
  AircraftTypeUpdateInput,
  AircraftUpdateInput,
  Airline,
  AirlineInput,
  AirlineUpdateInput,
  Airport,
  AirportInput,
  AirportUpdateInput,
  AppUser,
  Baggage,
  BaggageEvent,
  Booking,
  BookingInput,
  BookingUpdateInput,
  Charge,
  ChargeInput,
  ChargeUpdateInput,
  DelayPrediction,
  Flight,
  FlightEvent,
  FlightInput,
  FlightUpdateInput,
  Gate,
  GateAssignment,
  GateAssignmentInput,
  GateAssignmentUpdateInput,
  GateInput,
  GateUpdateInput,
  Incident,
  IncidentReport,
  InboundFeed,
  IncidentUpdateInput,
  Me,
  OptimizationRun,
  Passenger,
  PassengerInput,
  PassengerUpdateInput,
  RoleInput,
  RoleRecord,
  RoleUpdateInput,
  Rotation,
  RotationInput,
  RotationUpdateInput,
  Shift,
  ShiftInput,
  ShiftUpdateInput,
  Staff,
  StaffAssignment,
  StaffAssignmentInput,
  StaffAssignmentUpdateInput,
  StaffInput,
  StaffUpdateInput,
  Terminal,
  TerminalInput,
  TerminalUpdateInput,
  Turnaround,
  TurnaroundUpdateInput,
  UserUpdateInput,
} from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const TIMEOUT_MS = 15_000;

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
  } catch {
    /* no JSON body */
  }
  return fallback;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(408, "The API took too long to respond.");
    }
    throw new ApiError(0, "Cannot reach the API. Is it running?");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new ApiError(res.status, await errorMessage(res, res.statusText));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  getInboundFeed: () => request<InboundFeed>(API_ROUTES.opensky.inbound),

  me: () => request<Me>(API_ROUTES.auth.me),

  listActivity: (params: { offset?: number; limit?: number } = {}) =>
    request<ActivityLogEntry[]>(`${API_ROUTES.activity}${query(params)}`),

  listUsers: () => request<AppUser[]>(API_ROUTES.auth.users.collection),
  updateUser: (id: number, payload: UserUpdateInput) =>
    request<AppUser>(API_ROUTES.auth.users.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  listFlights: (params: { offset?: number; limit?: number } = {}) =>
    request<Flight[]>(`${API_ROUTES.flights.collection}${query(params)}`),
  getFlight: (id: number | string) =>
    request<Flight>(API_ROUTES.flights.item(id)),
  createFlight: (payload: FlightInput) =>
    request<Flight>(API_ROUTES.flights.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateFlight: (id: number, payload: FlightUpdateInput) =>
    request<Flight>(API_ROUTES.flights.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteFlight: (id: number) =>
    request<void>(API_ROUTES.flights.item(id), { method: "DELETE" }),
  listFlightEvents: (flightId?: number) =>
    request<FlightEvent[]>(
      `${API_ROUTES.flights.events}${query({ flight_id: flightId })}`
    ),
  listDelayPredictions: (flightId?: number) =>
    request<DelayPrediction[]>(
      `${API_ROUTES.flights.delayPredictions}${query({ flight_id: flightId })}`
    ),

  listAirports: () =>
    request<Airport[]>(`${API_ROUTES.airports.collection}?limit=500`),
  listAirportsPage: (params: {
    search?: string;
    offset?: number;
    limit?: number;
  }) =>
    request<Airport[]>(
      `${API_ROUTES.airports.collection}${query(params)}`
    ),
  countAirports: (search?: string) =>
    request<{ total: number }>(
      `${API_ROUTES.airports.count}${query({ search })}`
    ),
  searchAirports: (term: string) =>
    request<Airport[]>(
      `${API_ROUTES.airports.collection}${query({ search: term, limit: 20 })}`
    ),
  getAirport: (id: number) =>
    request<Airport>(API_ROUTES.airports.item(id)),
  createAirport: (payload: AirportInput) =>
    request<Airport>(API_ROUTES.airports.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAirport: (id: number, payload: AirportUpdateInput) =>
    request<Airport>(API_ROUTES.airports.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteAirport: (id: number) =>
    request<void>(API_ROUTES.airports.item(id), { method: "DELETE" }),

  listTerminals: () => request<Terminal[]>(API_ROUTES.terminals.collection),
  createTerminal: (payload: TerminalInput) =>
    request<Terminal>(API_ROUTES.terminals.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTerminal: (id: number, payload: TerminalUpdateInput) =>
    request<Terminal>(API_ROUTES.terminals.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteTerminal: (id: number) =>
    request<void>(API_ROUTES.terminals.item(id), { method: "DELETE" }),

  listAirlines: () => request<Airline[]>(API_ROUTES.airlines.collection),
  createAirline: (payload: AirlineInput) =>
    request<Airline>(API_ROUTES.airlines.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAirline: (id: number, payload: AirlineUpdateInput) =>
    request<Airline>(API_ROUTES.airlines.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteAirline: (id: number) =>
    request<void>(API_ROUTES.airlines.item(id), { method: "DELETE" }),

  listAircraft: () => request<Aircraft[]>(API_ROUTES.aircraft.collection),
  createAircraft: (payload: AircraftInput) =>
    request<Aircraft>(API_ROUTES.aircraft.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAircraft: (id: number, payload: AircraftUpdateInput) =>
    request<Aircraft>(API_ROUTES.aircraft.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteAircraft: (id: number) =>
    request<void>(API_ROUTES.aircraft.item(id), { method: "DELETE" }),

  listAircraftTypes: () =>
    request<AircraftType[]>(API_ROUTES.aircraftTypes.collection),
  createAircraftType: (payload: AircraftTypeInput) =>
    request<AircraftType>(API_ROUTES.aircraftTypes.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAircraftType: (id: number, payload: AircraftTypeUpdateInput) =>
    request<AircraftType>(API_ROUTES.aircraftTypes.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteAircraftType: (id: number) =>
    request<void>(API_ROUTES.aircraftTypes.item(id), { method: "DELETE" }),

  listGates: () => request<Gate[]>(API_ROUTES.gates.collection),
  createGate: (payload: GateInput) =>
    request<Gate>(API_ROUTES.gates.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateGate: (id: number, payload: GateUpdateInput) =>
    request<Gate>(API_ROUTES.gates.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteGate: (id: number) =>
    request<void>(API_ROUTES.gates.item(id), { method: "DELETE" }),

  listGateAssignments: () =>
    request<GateAssignment[]>(API_ROUTES.gateAssignments.collection),
  createGateAssignment: (payload: GateAssignmentInput) =>
    request<GateAssignment>(API_ROUTES.gateAssignments.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateGateAssignment: (id: number, payload: GateAssignmentUpdateInput) =>
    request<GateAssignment>(API_ROUTES.gateAssignments.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteGateAssignment: (id: number) =>
    request<void>(API_ROUTES.gateAssignments.item(id), { method: "DELETE" }),

  listOptimizationRuns: () =>
    request<OptimizationRun[]>(API_ROUTES.optimizationRuns.collection),
  createOptimizationRun: (payload: {
    requested_by: number;
    horizon_start: string;
    horizon_end: string;
    n_flights: number;
    status: string;
  }) =>
    request<OptimizationRun>(API_ROUTES.optimizationRuns.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listRotations: () =>
    request<Rotation[]>(API_ROUTES.operations.rotations.collection),
  createRotation: (payload: RotationInput) =>
    request<Rotation>(API_ROUTES.operations.rotations.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateRotation: (id: number, payload: RotationUpdateInput) =>
    request<Rotation>(API_ROUTES.operations.rotations.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteRotation: (id: number) =>
    request<void>(API_ROUTES.operations.rotations.item(id), {
      method: "DELETE",
    }),

  listTurnarounds: () =>
    request<Turnaround[]>(API_ROUTES.operations.turnarounds.collection),
  updateTurnaround: (rotationId: number, payload: TurnaroundUpdateInput) =>
    request<Turnaround>(API_ROUTES.operations.turnarounds.item(rotationId), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  listIncidents: () =>
    request<Incident[]>(API_ROUTES.operations.incidents.collection),
  createIncident: (payload: IncidentReport) =>
    request<Incident>(API_ROUTES.operations.incidents.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateIncident: (id: number, payload: IncidentUpdateInput) =>
    request<Incident>(API_ROUTES.operations.incidents.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteIncident: (id: number) =>
    request<void>(API_ROUTES.operations.incidents.item(id), {
      method: "DELETE",
    }),

  listBaggage: () => request<Baggage[]>(API_ROUTES.operations.baggage),
  listBaggageEvents: () =>
    request<BaggageEvent[]>(API_ROUTES.operations.baggageEvents),

  listStaff: () => request<Staff[]>(API_ROUTES.operations.staff.collection),
  createStaff: (payload: StaffInput) =>
    request<Staff>(API_ROUTES.operations.staff.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateStaff: (id: number, payload: StaffUpdateInput) =>
    request<Staff>(API_ROUTES.operations.staff.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteStaff: (id: number) =>
    request<void>(API_ROUTES.operations.staff.item(id), { method: "DELETE" }),

  listShifts: () => request<Shift[]>(API_ROUTES.operations.shifts.collection),
  createShift: (payload: ShiftInput) =>
    request<Shift>(API_ROUTES.operations.shifts.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateShift: (id: number, payload: ShiftUpdateInput) =>
    request<Shift>(API_ROUTES.operations.shifts.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteShift: (id: number) =>
    request<void>(API_ROUTES.operations.shifts.item(id), {
      method: "DELETE",
    }),

  listStaffAssignments: () =>
    request<StaffAssignment[]>(
      API_ROUTES.operations.staffAssignments.collection
    ),
  createStaffAssignment: (payload: StaffAssignmentInput) =>
    request<StaffAssignment>(API_ROUTES.operations.staffAssignments.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateStaffAssignment: (id: number, payload: StaffAssignmentUpdateInput) =>
    request<StaffAssignment>(API_ROUTES.operations.staffAssignments.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteStaffAssignment: (id: number) =>
    request<void>(API_ROUTES.operations.staffAssignments.item(id), {
      method: "DELETE",
    }),

  listCharges: () =>
    request<Charge[]>(API_ROUTES.operations.charges.collection),
  createCharge: (payload: ChargeInput) =>
    request<Charge>(API_ROUTES.operations.charges.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCharge: (id: number, payload: ChargeUpdateInput) =>
    request<Charge>(API_ROUTES.operations.charges.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteCharge: (id: number) =>
    request<void>(API_ROUTES.operations.charges.item(id), {
      method: "DELETE",
    }),

  listRoles: () => request<RoleRecord[]>(API_ROUTES.operations.roles.collection),
  createRole: (payload: RoleInput) =>
    request<RoleRecord>(API_ROUTES.operations.roles.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateRole: (id: number, payload: RoleUpdateInput) =>
    request<RoleRecord>(API_ROUTES.operations.roles.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteRole: (id: number) =>
    request<void>(API_ROUTES.operations.roles.item(id), { method: "DELETE" }),

  listPassengers: () =>
    request<Passenger[]>(API_ROUTES.operations.passengers.collection),
  createPassenger: (payload: PassengerInput) =>
    request<Passenger>(API_ROUTES.operations.passengers.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePassenger: (id: number, payload: PassengerUpdateInput) =>
    request<Passenger>(API_ROUTES.operations.passengers.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deletePassenger: (id: number) =>
    request<void>(API_ROUTES.operations.passengers.item(id), {
      method: "DELETE",
    }),

  listBookings: () =>
    request<Booking[]>(API_ROUTES.operations.bookings.collection),
  createBooking: (payload: BookingInput) =>
    request<Booking>(API_ROUTES.operations.bookings.collection, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateBooking: (id: number, payload: BookingUpdateInput) =>
    request<Booking>(API_ROUTES.operations.bookings.item(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteBooking: (id: number) =>
    request<void>(API_ROUTES.operations.bookings.item(id), {
      method: "DELETE",
    }),
};

export { API_URL };
