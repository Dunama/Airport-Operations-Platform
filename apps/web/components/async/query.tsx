"use client";

import type { ReactNode } from "react";

import type { AsyncResult } from "@/lib/use-async";
import { ErrorState } from "./states";

/**
 * Renders a skeleton while loading, an error card with retry on failure and
 * the resolved data on success.
 */
export function Query<T>({
  result,
  skeleton,
  children,
}: {
  result: AsyncResult<T>;
  skeleton: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (result.state.status === "loading") return <>{skeleton}</>;
  if (result.state.status === "error") {
    return <ErrorState error={result.state.error} onRetry={result.reload} />;
  }
  return <>{children(result.state.data)}</>;
}
