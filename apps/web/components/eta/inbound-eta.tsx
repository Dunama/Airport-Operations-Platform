"use client";

import Link from "next/link";
import { PlaneLanding, Radar, TriangleAlert } from "lucide-react";
import { cn } from "cn";

import { api } from "@/lib/api";
import { etaDelta, etaHeadline, type EtaTone } from "@/lib/eta";
import { formatTime } from "@/lib/format";
import type { InboundEta, InboundFeed } from "@/lib/types";
import { useAsync, type AsyncResult } from "@/lib/use-async";
import { Query } from "@/components/async/query";
import { EmptyState, ListSkeleton } from "@/components/async/states";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEED_POLL_MS = 30_000;

/** Shared by every screen that shows landing estimates; polls quietly. */
export function useInboundFeed(): AsyncResult<InboundFeed> {
  return useAsync("opensky-inbound", api.getInboundFeed, FEED_POLL_MS);
}

const TONE: Record<EtaTone, string> = {
  ok: "bg-status-ok-soft text-status-ok",
  pending: "bg-status-pending-soft text-status-pending",
  critical: "bg-status-critical-soft text-status-critical",
  neutral: "bg-status-neutral-soft text-status-neutral",
};

function DeltaChip({ item }: { item: InboundEta }) {
  const delta = etaDelta(item);
  if (!delta) return null;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE[delta.tone]
      )}
    >
      {delta.label}
    </span>
  );
}

function telemetry(item: InboundEta): string | null {
  if (item.distance_km == null) return null;
  const parts = [`${Math.round(item.distance_km)} km out`];
  if (item.ground_speed_kts != null) parts.push(`${item.ground_speed_kts} kt`);
  if (item.altitude_m != null) {
    parts.push(`${Math.round((item.altitude_m * 3.28084) / 100) * 100} ft`);
  }
  if (item.predicted_aldt) parts.push(`ALDT ~${formatTime(item.predicted_aldt)}`);
  return parts.join(" · ");
}

/** One-line banner: "DL802 lands in about 14 min". */
export function InboundEtaLine({
  item,
  className,
}: {
  item: InboundEta | undefined;
  className?: string;
}) {
  if (!item || item.phase === "no_signal") return null;
  const live = item.phase === "approaching" || item.phase === "final";
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-accent/60 px-4 py-3",
        className
      )}
    >
      <PlaneLanding
        className={cn("size-5 shrink-0", live ? "text-primary" : "text-muted-foreground")}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">{etaHeadline(item)}</div>
        {telemetry(item) && (
          <div className="text-xs text-muted-foreground">{telemetry(item)} · live ADS-B</div>
        )}
      </div>
      <DeltaChip item={item} />
    </div>
  );
}

const PHASE_ORDER: Record<InboundEta["phase"], number> = {
  final: 0,
  approaching: 1,
  landed: 2,
  not_inbound: 3,
  no_signal: 4,
};

function sortItems(items: InboundEta[]): InboundEta[] {
  return [...items].sort(
    (a, b) =>
      PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase] ||
      (a.minutes_to_landing ?? 9999) - (b.minutes_to_landing ?? 9999) ||
      a.sched_time.localeCompare(b.sched_time)
  );
}

function FeedNotice({ feed }: { feed: InboundFeed }) {
  if (feed.status === "live") return null;
  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-2 rounded-lg bg-status-pending-soft px-3 py-2.5 text-sm text-status-pending"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <span>
        {feed.status === "unconfigured"
          ? "Live landing estimates are off."
          : "Live landing estimates are temporarily unavailable."}{" "}
        {feed.detail}
      </span>
    </div>
  );
}

/** Dashboard card: every inbound flight with its live landing estimate. */
export function InboundEtaFeed({ className }: { className?: string }) {
  const result = useInboundFeed();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radar className="size-4 text-muted-foreground" />
          Inbound ETA
        </CardTitle>
        <CardDescription>
          Live from aircraft positions, ahead of airline updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Query result={result} skeleton={<ListSkeleton rows={3} />}>
          {(feed) => {
            const items = sortItems(feed.items);
            const tracked = items.filter((i) => i.phase !== "no_signal");
            const waiting = items.length - tracked.length;
            return (
              <>
                <FeedNotice feed={feed} />
                {items.length === 0 ? (
                  <EmptyState
                    title="No inbound flights"
                    hint="Arrivals due in the next 8 hours appear here."
                  />
                ) : (
                  <ul className="flex flex-col divide-y divide-border">
                    {tracked.slice(0, 8).map((item) => (
                      <li key={item.flight_id}>
                        <Link
                          href={
                            item.rotation_id != null
                              ? `/ground/turnaround/${item.rotation_id}`
                              : `/ground/flights/${item.flight_id}`
                          }
                          className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0"
                        >
                          <PlaneLanding className="size-4 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium">{etaHeadline(item)}</div>
                            <div className="text-xs text-muted-foreground">
                              {telemetry(item) ?? "Position acquired"} · scheduled{" "}
                              {formatTime(item.sched_time)}
                            </div>
                          </div>
                          <DeltaChip item={item} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {tracked.length === 0 && items.length > 0 && feed.status === "live" && (
                  <p className="text-sm text-muted-foreground">
                    {items.length} inbound flight{items.length === 1 ? "" : "s"} not yet in
                    radar range ({feed.tracked_aircraft} aircraft tracked around{" "}
                    {feed.airport_icao}).
                  </p>
                )}
                {tracked.length > 0 && waiting > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {waiting} more inbound flight{waiting === 1 ? "" : "s"} not yet in radar
                    range.
                  </p>
                )}
              </>
            );
          }}
        </Query>
      </CardContent>
    </Card>
  );
}
