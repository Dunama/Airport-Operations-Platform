"use client";

import * as React from "react";
import { Check, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { statusMeta } from "@/components/status/status-chip";

type StepState = "not_started" | "current" | "done" | "failed";
interface TurnaroundStep {
  id: string;
  label: string;
  state: StepState;
}

const TONE_RING: Record<StepState, string> = {
  done: "border-status-ok bg-status-ok-soft",
  current: "border-status-pending bg-status-pending-soft",
  not_started: "border-border bg-card",
  failed: "border-status-critical bg-status-critical-soft",
};

const TONE_ICON: Record<StepState, string> = {
  done: "bg-status-ok text-primary-foreground",
  current: "bg-status-pending text-primary-foreground",
  not_started: "bg-status-neutral-soft text-muted-foreground",
  failed: "bg-status-critical text-primary-foreground",
};

const CYCLE: Record<StepState, StepState> = {
  not_started: "current",
  current: "done",
  done: "not_started",
  failed: "current",
};

interface StepChecklistProps {
  steps: TurnaroundStep[];
  onChange?: (steps: TurnaroundStep[]) => void;
}

export function StepChecklist({ steps: initial, onChange }: StepChecklistProps) {
  const [steps, setSteps] = React.useState<TurnaroundStep[]>(initial);

  function update(next: TurnaroundStep[]) {
    setSteps(next);
    onChange?.(next);
  }

  function advance(step: TurnaroundStep) {
    update(
      steps.map((s) =>
        s.id === step.id ? { ...s, state: CYCLE[s.state] } : s
      )
    );
  }

  function flag(step: TurnaroundStep) {
    update(
      steps.map((s) =>
        s.id === step.id
          ? { ...s, state: s.state === "failed" ? "not_started" : "failed" }
          : s
      )
    );
  }

  const done = steps.filter((s) => s.state === "done").length;
  const pct = Math.round((done / Math.max(steps.length, 1)) * 100);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-status-neutral-soft">
          <div
            className="h-full rounded-full bg-status-ok transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-sm font-medium tabular-nums text-muted-foreground">
          {done}/{steps.length} · {pct}%
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={() => advance(step)}
              className={cn(
                "flex flex-1 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                TONE_RING[step.state],
                "focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  TONE_ICON[step.state]
                )}
              >
                {step.state === "done" ? (
                  <Check className="size-3.5" />
                ) : step.state === "failed" ? (
                  <TriangleAlert className="size-3.5" />
                ) : (
                  steps.indexOf(step) + 1
                )}
              </span>
              <span className="flex-1 text-sm font-medium">{step.label}</span>
              <span className="text-xs text-muted-foreground">
                {statusMeta(step.state).label}
              </span>
            </button>
            <button
              type="button"
              onClick={() => flag(step)}
              aria-label={
                step.state === "failed"
                  ? `Clear issue on ${step.label}`
                  : `Flag issue on ${step.label}`
              }
              title="Flag issue"
              className={cn(
                "flex w-9 shrink-0 items-center justify-center rounded-lg border transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                step.state === "failed"
                  ? "border-status-critical bg-status-critical text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-status-critical"
              )}
            >
              <TriangleAlert className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
