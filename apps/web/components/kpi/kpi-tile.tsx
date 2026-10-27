import type { ReactNode } from "react";
import { cn } from "cn";
import { Card } from "@/components/ui/card";
import type { StatusTone } from "@/components/status/status-chip";

const TONE_BAR: Record<StatusTone, string> = {
  critical: "bg-status-critical",
  ok: "bg-status-ok",
  pending: "bg-status-pending",
  neutral: "bg-status-neutral",
};

interface KpiTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: StatusTone;
}

export function KpiTile({ label, value, hint, tone = "neutral" }: KpiTileProps) {
  return (
    <Card size="sm" className="relative gap-1 overflow-hidden pl-5">
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          TONE_BAR[tone]
        )}
      />
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="font-heading text-2xl leading-none font-semibold tracking-tight">
        {value}
      </div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
