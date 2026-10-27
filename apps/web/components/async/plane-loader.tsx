import { cn } from "cn";

const SIZES = {
  sm: "size-6",
  md: "size-24",
  lg: "size-40",
} as const;

/**
 * A plane drifts in, banks, then climbs vertically and zooms out of frame
 * (keyframes live in globals.css). Everything is sized relative to the box,
 * so the same animation works as a 24px button spinner or a full-page boot
 * screen. Honors prefers-reduced-motion by holding the plane still.
 */
export function PlaneLoader({
  size = "md",
  label,
  className,
}: {
  size?: keyof typeof SIZES;
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex flex-col items-center gap-3", className)}
    >
      <div
        className={cn(
          "relative overflow-hidden text-primary",
          size !== "sm" && "rounded-full",
          SIZES[size]
        )}
        aria-hidden
      >
        {size !== "sm" && (
          <span className="aop-plane-glow absolute inset-[18%] rounded-full bg-primary/25 blur-xl" />
        )}
        <div
          className={cn(
            "aop-plane absolute will-change-transform",
            size === "sm" ? "inset-[14%]" : "inset-[30%]"
          )}
        >
          <span className="aop-plane-trail absolute left-1/2 top-[88%] h-[300%] w-[7%] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/80 to-transparent" />
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="relative size-full drop-shadow-[0_2px_6px_color-mix(in_oklch,var(--primary)_55%,transparent)]"
          >
            <path d="M12 1.5c.9 0 1.6 1.3 1.6 3.2v5.1l8.4 4.9v2.4l-8.4-2.5v4.2l2.2 1.7v1.8L12 21.6l-3.8 1.2v-1.8l2.2-1.7v-4.2L2 17.1v-2.4l8.4-4.9V4.7c0-1.9.7-3.2 1.6-3.2z" />
          </svg>
        </div>
      </div>
      {label ? (
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
}

/** Full-viewport variant for boot / redirect screens. */
export function PageLoader({ label = "Preparing for takeoff…" }: { label?: string }) {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <PlaneLoader size="lg" label={label} />
    </div>
  );
}
