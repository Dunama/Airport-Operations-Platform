"use client";

import * as React from "react";
import { Bell, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "cn";

import { api } from "@/lib/api";
import { relativeLabel } from "@/lib/format";
import { useAsync } from "@/lib/use-async";
import { useSession } from "@/lib/use-session";
import type { ActivityLogEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ACTION_META: Record<
  ActivityLogEntry["action"],
  { icon: React.ElementType; bg: string; color: string }
> = {
  create: { icon: Plus, bg: "bg-status-ok-soft", color: "text-status-ok" },
  update: { icon: Pencil, bg: "bg-status-pending-soft", color: "text-status-pending" },
  delete: { icon: Trash2, bg: "bg-status-critical-soft", color: "text-status-critical" },
};

const SEEN_KEY = "aop:activity:last-seen-id";
const seenListeners = new Set<() => void>();

function readLastSeenId(): number {
  if (typeof window === "undefined") return 0;
  const stored = Number(window.localStorage.getItem(SEEN_KEY) ?? 0);
  return Number.isFinite(stored) ? stored : 0;
}

function writeLastSeenId(id: number) {
  try {
    window.localStorage.setItem(SEEN_KEY, String(id));
  } catch {
    /* localStorage unavailable */
  }
  seenListeners.forEach((listener) => listener());
}

function subscribeLastSeenId(onChange: () => void) {
  seenListeners.add(onChange);
  return () => seenListeners.delete(onChange);
}

/** Last-seen activity id from localStorage, safe across SSR/hydration. */
function useLastSeenId(): number {
  return React.useSyncExternalStore(
    subscribeLastSeenId,
    readLastSeenId,
    () => 0
  );
}

async function loadActivityData() {
  const [activity, users] = await Promise.all([
    api.listActivity({ limit: 25 }),
    api.listUsers(),
  ]);
  return { activity, users };
}

export function NotificationBell() {
  const session = useSession();
  const canView = session?.role === "admin" || session?.role === "ops";
  const [open, setOpen] = React.useState(false);
  const lastSeenId = useLastSeenId();

  const result = useAsync(
    canView ? "activity-bell" : "",
    loadActivityData,
    30_000
  );

  if (!canView) return null;

  const activity = result.state.status === "ready" ? result.state.data.activity : [];
  const userById =
    result.state.status === "ready"
      ? new Map(result.state.data.users.map((u) => [u.id, u]))
      : new Map();
  const unreadCount = activity.filter((a) => a.id > lastSeenId).length;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && activity.length > 0) {
      const newest = Math.max(...activity.map((a) => a.id));
      writeLastSeenId(newest);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label="Notifications"
          />
        }
      >
        <Bell />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-2 rounded-full bg-status-critical" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-2.5 text-sm font-semibold">
            Activity
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto py-1">
          {activity.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing recorded yet.
            </p>
          ) : (
            <ul className="flex flex-col">
              {activity.map((entry) => {
                const meta = ACTION_META[entry.action];
                const Icon = meta.icon;
                const actor = userById.get(entry.actor_id);
                return (
                  <li
                    key={entry.id}
                    className="flex items-start gap-2.5 px-3 py-2 hover:bg-accent"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                        meta.bg
                      )}
                    >
                      <Icon className={cn("size-3.5", meta.color)} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">
                        <span className="font-medium">
                          {actor?.email ?? `User #${entry.actor_id}`}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {entry.summary.toLowerCase()}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {relativeLabel(entry.created_at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
