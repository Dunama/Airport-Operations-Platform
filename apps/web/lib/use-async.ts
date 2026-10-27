"use client";

import * as React from "react";

import { ApiError } from "./api";
import { clearSession } from "./auth";

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: ApiError }
  | { status: "ready"; data: T };

export interface AsyncResult<T> {
  state: AsyncState<T>;
  reload: () => void;
}

/**
 * Runs `loader` whenever `key` changes. All state updates happen inside async
 * callbacks so the component stays compliant with react-hooks/set-state-in-effect.
 * A 401 clears the session and bounces to /login.
 */
export function useAsync<T>(
  key: string,
  loader: () => Promise<T>,
  pollMs?: number
): AsyncResult<T> {
  const [nonce, setNonce] = React.useState(0);
  const [state, setState] = React.useState<AsyncState<T>>({
    status: "loading",
  });
  const loaderRef = React.useRef(loader);

  React.useEffect(() => {
    loaderRef.current = loader;
  });

  React.useEffect(() => {
    if (!key) return;
    let active = true;
    loaderRef.current().then(
      (data) => {
        if (active) setState({ status: "ready", data });
      },
      (error: unknown) => {
        if (!active) return;
        const apiError =
          error instanceof ApiError
            ? error
            : new ApiError(0, "Something went wrong.");
        if (apiError.status === 401) {
          clearSession();
          return;
        }
        setState({ status: "error", error: apiError });
      }
    );
    return () => {
      active = false;
    };
  }, [key, nonce]);

  /** Silently refresh in the background without flashing the skeleton. */
  React.useEffect(() => {
    if (!pollMs || !key) return;
    const timer = setInterval(() => {
      loaderRef.current().then(
        (data) => setState({ status: "ready", data }),
        () => {
          /* keep the last good data on transient failures */
        }
      );
    }, pollMs);
    return () => clearInterval(timer);
  }, [key, pollMs]);

  const reload = React.useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  return { state, reload };
}
