import type { Airport, Flight, Rotation, Turnaround } from "./types";

export function indexBy<T, K>(items: T[], key: (item: T) => K): Map<K, T> {
  return new Map(items.map((item) => [key(item), item]));
}

export function airportCode(airport: Airport | null | undefined): string {
  return airport?.iata ?? "—";
}

export function isArrival(flight: Pick<Flight, "direction">): boolean {
  return flight.direction === "ARR" || flight.direction === "IN";
}

/** The opposing airport for a movement, e.g. an arrival shows its origin. */
export function counterpartAirport(
  flight: Flight,
  airports: Map<number, Airport>
): Airport | undefined {
  return airports.get(isArrival(flight) ? flight.origin_id : flight.dest_id);
}

export interface TurnaroundMilestone {
  key: keyof Turnaround;
  label: string;
  short: string;
}

export const TURNAROUND_MILESTONES: TurnaroundMilestone[] = [
  { key: "aldt", label: "Aircraft landed", short: "ALDT" },
  { key: "aibt", label: "On block", short: "AIBT" },
  { key: "tobt", label: "Target off-block", short: "TOBT" },
  { key: "tsat", label: "Start-up approved", short: "TSAT" },
  { key: "aobt", label: "Off block", short: "AOBT" },
  { key: "atot", label: "Airborne", short: "ATOT" },
];

export function turnaroundMilestoneList(turnaround: Turnaround) {
  return TURNAROUND_MILESTONES.map((m) => ({
    ...m,
    at: turnaround[m.key] as string | null,
  }));
}

export function turnaroundProgress(turnaround: Turnaround): number {
  const done = TURNAROUND_MILESTONES.filter(
    (m) => turnaround[m.key] != null
  ).length;
  return Math.round((done / TURNAROUND_MILESTONES.length) * 100);
}

export type TurnaroundState =
  | "scheduled"
  | "in_progress"
  | "at_risk"
  | "completed";

/**
 * Derived state used for the color contract:
 * - completed: airborne (ATOT recorded)
 * - at_risk:   the forecast ready time slips past the target off-block (TOBT)
 * - in_progress: aircraft on block (AIBT) but not airborne yet
 * - scheduled: no on-block time recorded
 */
export function turnaroundState(turnaround: Turnaround): TurnaroundState {
  if (turnaround.atot) return "completed";
  const { predicted_ready, tobt } = turnaround;
  if (predicted_ready && tobt && new Date(predicted_ready) > new Date(tobt)) {
    return "at_risk";
  }
  if (turnaround.aibt || turnaround.aldt) return "in_progress";
  return "scheduled";
}

export function rotationsForFlight(
  flight: Flight,
  rotations: Rotation[]
): Rotation | undefined {
  return rotations.find((rotation) => rotation.id === flight.rotation_id);
}
