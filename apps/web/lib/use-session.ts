"use client";

import { useSyncExternalStore } from "react";
import { SESSION_CHANGED_EVENT, type Session } from "./auth";

const SESSION_KEY = "aop.session";

let cachedRaw: string | null | undefined;
let cachedSession: Session | null;

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (e: StorageEvent) => {
    if (e.key === null || e.key === SESSION_KEY) onStoreChange();
  };
  window.addEventListener("storage", handler);
  window.addEventListener(SESSION_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(SESSION_CHANGED_EVENT, onStoreChange);
  };
}

function getSnapshot(): Session | null {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSession = raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      cachedSession = null;
    }
  }
  return cachedSession;
}

function getServerSnapshot(): Session | null {
  return null;
}

/** Session from localStorage, safe across SSR/hydration (no setState-in-effect). */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const emptySubscribe = () => () => {};

/** False during SSR/hydration, true after — the React-recommended client check. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
