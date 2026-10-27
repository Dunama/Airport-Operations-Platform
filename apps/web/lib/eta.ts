import { isArrival } from "./derive";
import type { Flight, InboundEta } from "./types";

/** "14 min" / "1 h 05 min" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} h ${String(m).padStart(2, "0")} min`;
}

/** The sentence the ground crew reads, e.g. "DL802 lands in about 14 min". */
export function etaHeadline(item: InboundEta): string {
  const { flight_no: no, phase, minutes_to_landing: mins } = item;
  switch (phase) {
    case "landed":
      return `${no} has landed`;
    case "final":
    case "approaching":
      if (mins == null) return `${no} is inbound`;
      if (mins < 1) return `${no} is landing now`;
      return `${no} lands in about ${formatDuration(mins)}`;
    case "not_inbound":
      return `${no} is airborne but not yet heading to the airport`;
    default:
      return `${no} is not in radar range yet`;
  }
}

/** Short form for table cells. */
export function etaShort(item: InboundEta): string | null {
  if (item.phase === "landed") return "Landed";
  if (item.minutes_to_landing == null) return null;
  return item.minutes_to_landing < 1
    ? "Landing now"
    : `in ~${formatDuration(item.minutes_to_landing)}`;
}

export type EtaTone = "ok" | "pending" | "critical" | "neutral";

/** Gap between the live estimate and what the airline has told us. */
export function etaDelta(item: InboundEta): { label: string; tone: EtaTone } | null {
  const d = item.est_time ? item.delta_vs_est_min : item.delta_vs_sched_min;
  if (d == null) return null;
  const against = item.est_time ? "airline ETA" : "schedule";
  if (Math.abs(d) < 5) return { label: `On ${against}`, tone: "ok" };
  return d < 0
    ? { label: `${-d} min early vs ${against}`, tone: "ok" }
    : { label: `${d} min late vs ${against}`, tone: d >= 15 ? "critical" : "pending" };
}

/** Index feed items by the rotation they belong to (arrivals only). */
export function etaByRotation(items: InboundEta[]): Map<number, InboundEta> {
  const map = new Map<number, InboundEta>();
  for (const item of items) {
    if (item.rotation_id != null) map.set(item.rotation_id, item);
  }
  return map;
}

/** The inbound leg of a rotation's flights, if any. */
export function inboundLeg(flights: Flight[]): Flight | undefined {
  return flights.find(isArrival);
}
