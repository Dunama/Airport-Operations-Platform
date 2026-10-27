/**
 * Domain types mirror the FastAPI schemas 1:1 (snake_case on purpose) so the
 * web app never drifts from the source of truth in `apps/api`.
 */

export type Role = "admin" | "ops" | "airline" | "ground" | "guest";

export type FlightDirection = "ARR" | "DEP" | "IN" | "OUT";

export interface Airline {
  id: number;
  iata: string;
  name: string;
}

export interface Airport {
  id: number;
  iata: string;
  icao: string;
  name: string;
  timezone: string;
}

export interface AircraftType {
  id: number;
  icao_code: string;
  size: string;
  seats: number;
  typical_turn_min: number;
}

export interface Aircraft {
  id: number;
  registration: string;
  airline_id: number;
  type_id: number;
}

export interface Terminal {
  id: number;
  airport_id: number;
  code: string;
}

export interface Gate {
  id: number;
  terminal_id: number;
  code: string;
  kind: string;
  max_size: string;
  intl_capable: boolean;
  status: string;
}

export interface Flight {
  id: number;
  rotation_id: number;
  airline_id: number;
  origin_id: number;
  dest_id: number;
  flight_no: string;
  direction: FlightDirection;
  sched_time: string;
  est_time: string | null;
  actual_time: string | null;
  status: string;
  version: number;
}

export interface Rotation {
  id: number;
  aircraft_id: number;
  on_block_planned: string;
  off_block_planned: string;
}

export interface Turnaround {
  rotation_id: number;
  aldt: string | null;
  aibt: string | null;
  tobt: string | null;
  tsat: string | null;
  aobt: string | null;
  atot: string | null;
  predicted_ready: string | null;
  predicted_aldt: string | null;
}

export interface Incident {
  id: number;
  flight_id: number;
  gate_id: number;
  reported_by: number;
  category: string;
  severity: number;
  status: string;
  created_at: string;
  closed_at: string | null;
}

export interface Baggage {
  id: number;
  booking_id: number;
  flight_id: number;
  flight_no: string | null;
  passenger_name: string | null;
  tag: string;
  /** Serialized as a string by the API (Decimal). */
  weight_kg: string;
  last_location: string | null;
  last_scanned_at: string | null;
}

export interface BaggageEvent {
  id: number;
  baggage_id: number;
  location: string;
  scanned_at: string;
}

export interface Staff {
  id: number;
  user_id: number;
  name: string;
  skill: string;
}

export interface Shift {
  id: number;
  staff_id: number;
  start: string;
  end: string;
}

export interface StaffAssignment {
  id: number;
  shift_id: number;
  rotation_id: number;
  task: string;
}

export interface GateAssignment {
  id: number;
  rotation_id: number;
  gate_id: number;
  run_id: number;
  source: string;
  is_active: boolean;
  start: string;
  end: string;
}

export interface OptimizationRun {
  id: number;
  requested_by: number;
  horizon_start: string;
  horizon_end: string;
  n_flights: number;
  status: string;
  objective: string | null;
  solve_ms: number | null;
}

export interface Charge {
  id: number;
  flight_id: number;
  kind: string;
  amount_minor: number;
  currency: string;
}

export interface RoleRecord {
  id: number;
  name: string;
}

export interface AppUser {
  id: number;
  email: string;
  role_id: number;
  airline_id: number;
  is_active: boolean;
}

export interface Passenger {
  id: number;
  name: string;
  nationality: string;
}

export interface Booking {
  id: number;
  flight_id: number;
  passenger_id: number;
  seat: string;
  checked_in_at: string | null;
  boarded_at: string | null;
}

export interface FlightEvent {
  id: number;
  flight_id: number;
  actor_user_id: number;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface DelayPrediction {
  id: number;
  flight_id: number;
  model_version: string;
  p_delay_15: number;
  expected_delay_min: number;
  top_factors: Record<string, unknown>;
  scored_at: string;
}

export interface ActivityLogEntry {
  id: number;
  actor_id: number;
  action: "create" | "update" | "delete";
  entity: string;
  summary: string;
  created_at: string;
}

export interface Me {
  id: number;
  email: string;
  role: Role;
  airline_id: number;
  is_active: boolean;
}

export interface IncidentReport {
  flight_id: number;
  gate_id: number;
  category: string;
  severity: number;
  status?: string;
}

/* ------------------------------ write payloads ----------------------------- */

export const FLIGHT_STATUSES = [
  "scheduled",
  "boarding",
  "departed",
  "arrived",
  "delayed",
  "cancelled",
  "diverted",
] as const;

export const FLIGHT_DIRECTIONS: FlightDirection[] = ["ARR", "DEP", "IN", "OUT"];

export interface FlightInput {
  airline_id: number;
  origin_id: number;
  dest_id: number;
  flight_no: string;
  direction: FlightDirection;
  /** ISO-8601 timestamp. */
  sched_time: string;
  est_time?: string | null;
  actual_time?: string | null;
  status: string;
  rotation_id?: number | null;
  aircraft_id?: number | null;
}

export type FlightUpdateInput = Partial<
  Omit<FlightInput, "rotation_id" | "aircraft_id">
>;

export interface AirlineInput {
  iata: string;
  name: string;
}

export type AirlineUpdateInput = Partial<AirlineInput>;

export interface AirportInput {
  iata: string;
  icao: string;
  name: string;
  timezone: string;
}

export type AirportUpdateInput = Partial<AirportInput>;

export interface AircraftTypeInput {
  icao_code: string;
  size: string;
  seats: number;
  typical_turn_min: number;
}

export type AircraftTypeUpdateInput = Partial<AircraftTypeInput>;

export interface AircraftInput {
  registration: string;
  airline_id: number;
  type_id: number;
}

export type AircraftUpdateInput = Partial<AircraftInput>;

export interface TerminalInput {
  airport_id: number;
  code: string;
}

export type TerminalUpdateInput = Partial<TerminalInput>;

export interface GateInput {
  terminal_id: number;
  code: string;
  kind: string;
  max_size: string;
  intl_capable: boolean;
  status: string;
}

export type GateUpdateInput = Partial<GateInput>;

export interface GateAssignmentInput {
  rotation_id: number;
  gate_id: number;
  run_id: number;
  source: string;
  is_active?: boolean;
  start: string;
  end: string;
}

export type GateAssignmentUpdateInput = Partial<GateAssignmentInput>;

export interface RotationInput {
  aircraft_id: number;
  on_block_planned: string;
  off_block_planned: string;
}

export type RotationUpdateInput = Partial<RotationInput>;

export interface TurnaroundUpdateInput {
  aldt?: string | null;
  aibt?: string | null;
  tobt?: string | null;
  tsat?: string | null;
  aobt?: string | null;
  atot?: string | null;
  predicted_ready?: string | null;
}

export interface StaffInput {
  user_id: number;
  name: string;
  skill: string;
}

export type StaffUpdateInput = Partial<StaffInput>;

export interface ShiftInput {
  staff_id: number;
  start: string;
  end: string;
}

export type ShiftUpdateInput = Partial<ShiftInput>;

export interface StaffAssignmentInput {
  shift_id: number;
  rotation_id: number;
  task: string;
}

export type StaffAssignmentUpdateInput = Partial<StaffAssignmentInput>;

export interface IncidentUpdateInput {
  category?: string;
  severity?: number;
  status?: string;
  closed_at?: string | null;
}

export interface ChargeInput {
  flight_id: number;
  kind: string;
  amount_minor: number;
  currency: string;
}

export type ChargeUpdateInput = Partial<ChargeInput>;

export interface RoleInput {
  name: string;
}

export type RoleUpdateInput = Partial<RoleInput>;

export interface UserUpdateInput {
  role_id?: number;
  airline_id?: number;
  is_active?: boolean;
}

export interface PassengerInput {
  name: string;
  nationality: string;
}

export type PassengerUpdateInput = Partial<PassengerInput>;

export interface BookingInput {
  flight_id: number;
  passenger_id: number;
  seat: string;
  checked_in_at?: string | null;
  boarded_at?: string | null;
}

export type BookingUpdateInput = Partial<BookingInput>;

/* ---------------------------- OpenSky inbound ETA --------------------------- */

export type InboundPhase =
  | "approaching"
  | "final"
  | "landed"
  | "not_inbound"
  | "no_signal";

export interface InboundEta {
  flight_id: number;
  rotation_id: number | null;
  airline_id: number;
  flight_no: string;
  sched_time: string;
  est_time: string | null;
  phase: InboundPhase;
  callsign: string | null;
  icao24: string | null;
  distance_km: number | null;
  ground_speed_kts: number | null;
  altitude_m: number | null;
  minutes_to_landing: number | null;
  predicted_aldt: string | null;
  position_age_s: number | null;
  delta_vs_sched_min: number | null;
  delta_vs_est_min: number | null;
}

export interface InboundFeed {
  status: "live" | "unconfigured" | "unavailable";
  detail: string | null;
  fetched_at: string;
  airport_icao: string;
  tracked_aircraft: number;
  items: InboundEta[];
}
