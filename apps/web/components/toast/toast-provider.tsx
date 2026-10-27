"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "cn";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastInput {
  variant?: ToastVariant;
  title: string;
  description?: string;
  /** Milliseconds before auto-dismiss. Set to 0 to require manual close. */
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastInput, "title" | "variant" | "duration">> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

const VARIANT_META: Record<
  ToastVariant,
  { icon: React.ElementType; bg: string; border: string; icon_color: string }
> = {
  success: {
    icon: CheckCircle2,
    bg: "bg-status-ok-soft",
    border: "border-status-ok",
    icon_color: "text-status-ok",
  },
  error: {
    icon: XCircle,
    bg: "bg-status-critical-soft",
    border: "border-status-critical",
    icon_color: "text-status-critical",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-status-pending-soft",
    border: "border-status-pending",
    icon_color: "text-status-pending",
  },
  info: {
    icon: Info,
    bg: "bg-status-neutral-soft",
    border: "border-status-neutral",
    icon_color: "text-status-neutral",
  },
};

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const meta = VARIANT_META[item.variant];
  const Icon = meta.icon;

  React.useEffect(() => {
    if (item.duration <= 0) return;
    const timer = setTimeout(() => onDismiss(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "animate-in slide-in-from-top-2 fade-in pointer-events-auto flex w-full items-start gap-3 rounded-xl border-l-4 bg-card p-3.5 shadow-lg ring-1 ring-foreground/5",
        meta.border
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
          meta.bg
        )}
      >
        <Icon className={cn("size-4", meta.icon_color)} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-card-foreground">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = React.useCallback((input: ToastInput) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setItems((current) => [
      ...current,
      {
        id,
        variant: input.variant ?? "info",
        title: input.title,
        description: input.description,
        duration: input.duration ?? 4500,
      },
    ]);
  }, []);

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
