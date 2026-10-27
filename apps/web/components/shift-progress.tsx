"use client";

import * as React from "react";

import { formatTime, minutesUntil, progressPct } from "@/lib/format";

export function ShiftProgress({
  start,
  end,
}: {
  start: string;
  end: string;
}) {
  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 30_000);
    const initial = window.setTimeout(tick, 0);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(initial);
    };
  }, []);

  const pct = now === null ? 0 : progressPct(start, end, now);
  const remaining = now === null ? null : minutesUntil(end, now);

  const remainingLabel =
    remaining === null
      ? "—"
      : remaining <= 0
        ? "Shift complete"
        : `${Math.floor(remaining / 60)}h ${remaining % 60}m left`;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
          {pct}%
        </span>
        <span className="text-xs text-muted-foreground">{remainingLabel}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Shift elapsed"
        className="h-2 w-full overflow-hidden rounded-full bg-status-neutral-soft"
      >
        <div
          className="h-full rounded-full bg-status-ok transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{formatTime(start)}</span>
        <span>{formatTime(end)}</span>
      </div>
    </div>
  );
}
