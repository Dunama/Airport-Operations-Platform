/**
 * The color contract lives here and nowhere else:
 * red = danger / problem · green = done / on-track · yellow = pending / waiting ·
 * slate = neutral info. Components ask for a tone, never a raw color.
 */

export type StatusTone = "critical" | "ok" | "pending" | "neutral";

export interface StatusMeta {
  tone: StatusTone;
  label: string;
}

export const STATUS_META: Record<string, StatusMeta> = {
  /* flights */
  scheduled: { tone: "neutral", label: "Scheduled" },
  boarding: { tone: "ok", label: "Boarding" },
  on_time: { tone: "ok", label: "On time" },
  departed: { tone: "ok", label: "Departed" },
  arrived: { tone: "ok", label: "Arrived" },
  delayed: { tone: "pending", label: "Delayed" },
  cancelled: { tone: "critical", label: "Cancelled" },
  diverted: { tone: "critical", label: "Diverted" },
  /* turnarounds (derived) */
  in_progress: { tone: "pending", label: "In progress" },
  at_risk: { tone: "critical", label: "At risk" },
  completed: { tone: "ok", label: "Completed" },
  /* incidents */
  open: { tone: "pending", label: "Open" },
  investigating: { tone: "pending", label: "Investigating" },
  resolved: { tone: "ok", label: "Resolved" },
  closed: { tone: "ok", label: "Closed" },
};

export function statusMeta(key: string): StatusMeta {
  return STATUS_META[key] ?? { tone: "neutral", label: key };
}

const SEVERITY: Record<number, StatusMeta> = {
  1: { tone: "neutral", label: "Severity 1" },
  2: { tone: "neutral", label: "Severity 2" },
  3: { tone: "pending", label: "Severity 3" },
  4: { tone: "critical", label: "Severity 4" },
  5: { tone: "critical", label: "Severity 5" },
};

export function severityMeta(severity: number): StatusMeta {
  return SEVERITY[severity] ?? { tone: "neutral", label: `Severity ${severity}` };
}
