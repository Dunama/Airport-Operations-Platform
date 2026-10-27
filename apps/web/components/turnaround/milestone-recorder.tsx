"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "cn";

import { api } from "@/lib/api";
import { TURNAROUND_MILESTONES } from "@/lib/derive";
import { formatTime } from "@/lib/format";
import type { Turnaround } from "@/lib/types";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";

export function MilestoneRecorder({
  turnaround,
  onRecorded,
}: {
  turnaround: Turnaround;
  onRecorded: () => void;
}) {
  const { toast } = useToast();
  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function record(key: (typeof TURNAROUND_MILESTONES)[number]["key"]) {
    const milestone = TURNAROUND_MILESTONES.find((m) => m.key === key);
    setBusyKey(key);
    setError(null);
    try {
      await api.updateTurnaround(turnaround.rotation_id, {
        [key]: new Date().toISOString(),
      });
      toast({
        variant: "success",
        title: `${milestone?.short ?? "Milestone"} recorded`,
        description: milestone?.label,
      });
      onRecorded();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not record the milestone.";
      setError(message);
      toast({ variant: "error", title: "Couldn't record milestone", description: message });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-border">
        {TURNAROUND_MILESTONES.map((milestone) => {
          const at = turnaround[milestone.key] as string | null;
          const done = at != null;
          return (
            <li
              key={milestone.key}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full",
                    done ? "bg-status-ok text-background" : "bg-status-neutral-soft"
                  )}
                >
                  {done && <Check className="size-2.5" strokeWidth={3} />}
                </span>
                <span className="text-sm font-medium">{milestone.label}</span>
                <span className="text-xs text-muted-foreground">{milestone.short}</span>
              </div>
              {done ? (
                <span className="text-sm tabular-nums text-muted-foreground">
                  {formatTime(at)}
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyKey !== null}
                  onClick={() => record(milestone.key)}
                >
                  {busyKey === milestone.key ? (
                    <Loader2 className="animate-spin" />
                  ) : null}
                  Record now
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-status-critical-soft px-3 py-2 text-sm text-status-critical"
        >
          {error}
        </p>
      )}
    </div>
  );
}
