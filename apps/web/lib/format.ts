const timeFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
});

const dayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short" });

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return timeFmt.format(new Date(iso));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dateFmt.format(new Date(iso));
}

export function formatDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dayFmt.format(new Date(iso));
}

export function isToday(iso: string | null | undefined, ref = new Date()): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function minutesUntil(iso: string | null | undefined, ref = Date.now()): number {
  if (!iso) return Number.NaN;
  return Math.round((new Date(iso).getTime() - ref) / 60_000);
}

export function relativeLabel(iso: string | null | undefined, ref = Date.now()): string {
  const mins = minutesUntil(iso, ref);
  if (Number.isNaN(mins)) return "—";
  if (Math.abs(mins) < 1) return "now";
  if (mins < 0) return `${Math.abs(mins)}m ago`;
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest === 0 ? `in ${hours}h` : `in ${hours}h ${rest}m`;
}

export function formatDuration(startIso: string, endIso: string): string {
  const mins = Math.round(
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000
  );
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** ISO timestamp → value for an `<input type="datetime-local">`. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** `<input type="datetime-local">` value → ISO timestamp. */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function progressPct(
  startIso: string,
  endIso: string,
  ref = Date.now()
): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const total = Math.max(end - start, 1);
  const elapsed = Math.min(Math.max(ref - start, 0), total);
  return Math.round((elapsed / total) * 100);
}
