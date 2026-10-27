import { cn } from "cn";

import { statusMeta, type StatusTone } from "@/lib/status";

export type { StatusMeta, StatusTone } from "@/lib/status";
export { statusMeta } from "@/lib/status";

const TONE_TEXT: Record<StatusTone, string> = {
  critical: "bg-status-critical-soft text-status-critical",
  ok: "bg-status-ok-soft text-status-ok",
  pending: "bg-status-pending-soft text-status-pending",
  neutral: "bg-status-neutral-soft text-status-neutral",
};

const TONE_DOT: Record<StatusTone, string> = {
  critical: "bg-status-critical",
  ok: "bg-status-ok",
  pending: "bg-status-pending",
  neutral: "bg-status-neutral",
};

interface StatusChipProps {
  status: string;
  label?: string;
  tone?: StatusTone;
  className?: string;
  showDot?: boolean;
}

export function StatusChip({
  status,
  label,
  tone,
  className,
  showDot,
}: StatusChipProps) {
  const meta = statusMeta(status);
  const resolvedTone = tone ?? meta.tone;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_TEXT[resolvedTone],
        className
      )}
    >
      {showDot && (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[resolvedTone])}
        />
      )}
      {label ?? meta.label}
    </span>
  );
}

interface StatusDotProps {
  status: string;
  tone?: StatusTone;
  className?: string;
}

export function StatusDot({ status, tone, className }: StatusDotProps) {
  const meta = statusMeta(status);
  return (
    <span
      aria-label={meta.label}
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        TONE_DOT[tone ?? meta.tone],
        className
      )}
    />
  );
}

export { TONE_DOT, TONE_TEXT };
