"use client";

import { Check } from "lucide-react";
import { cn } from "cn";

import { turnaroundMilestoneList } from "@/lib/derive";
import { formatTime } from "@/lib/format";
import type { Turnaround } from "@/lib/types";

export function MilestoneList({ turnaround }: { turnaround: Turnaround }) {
  const milestones = turnaroundMilestoneList(turnaround);

  return (
    <ol className="relative flex flex-col gap-5 border-l border-border pl-6">
      {milestones.map((milestone) => {
        const done = milestone.at != null;
        return (
          <li key={milestone.short} className="relative">
            <span
              aria-hidden
              className={cn(
                "absolute top-0 -left-[31px] flex size-4 items-center justify-center rounded-full ring-4 ring-card",
                done
                  ? "bg-status-ok text-background"
                  : "bg-status-neutral-soft ring-card"
              )}
            >
              {done && <Check className="size-2.5" strokeWidth={3} />}
            </span>
            <div className="flex items-baseline justify-between gap-3">
              <span
                className={cn(
                  "text-sm font-medium",
                  done ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {milestone.label}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {milestone.short}
                </span>
              </span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {done ? formatTime(milestone.at) : "—"}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
