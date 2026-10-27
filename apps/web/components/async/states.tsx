"use client";

import { RefreshCw, TriangleAlert, Inbox, type LucideIcon } from "lucide-react";

import type { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ErrorState({
  error,
  onRetry,
  compact,
}: {
  error: ApiError;
  onRetry?: () => void;
  compact?: boolean;
}) {
  const title =
    error.status === 0 || error.status === 408
      ? "Can't reach the API"
      : "Something went wrong";

  if (compact) {
    return (
      <div
        role="alert"
        className="flex items-center gap-3 rounded-lg bg-status-critical-soft px-3 py-2.5 text-sm text-status-critical"
      >
        <TriangleAlert className="size-4 shrink-0" />
        <span className="flex-1">{error.message}</span>
        {onRetry && (
          <Button size="sm" variant="ghost" onClick={onRetry}>
            <RefreshCw />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-status-critical-soft text-status-critical">
          <TriangleAlert className="size-5" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{error.message}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  hint,
  icon: Icon = Inbox,
}: {
  title: string;
  hint?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-status-neutral-soft text-status-neutral">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function TileSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}
