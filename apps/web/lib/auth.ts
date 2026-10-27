import type { Me, Role } from "./types";
import { API_ROUTES } from "./routes";

export type { Role };

export interface Session {
  id: number;
  name: string;
  email: string;
  role: Role;
  airlineId: number;
}

const SESSION_KEY = "aop.session";
const TOKEN_KEY = "aop.token";
export const SESSION_CHANGED_EVENT = "aop:session-changed";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Where each role lands after login. Ops/admin reuse the ground views. */
export function homeForRole(role: Role): string {
  switch (role) {
    case "airline":
      return "/airline";
    case "guest":
      return "/login";
    default:
      return "/ground";
  }
}

export function isBrowser() {
  return typeof window !== "undefined";
}

function displayName(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}

export function sessionFromMe(me: Me): Session {
  return {
    id: me.id,
    name: displayName(me.email),
    email: me.email,
    role: me.role,
    airlineId: me.airline_id,
  };
}

export function getSession(): Session | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setSession(session: Session, token: string) {
  if (!isBrowser()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
  window.dispatchEvent(new StorageEvent("storage", { key: SESSION_KEY }));
}

export function clearSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
  window.dispatchEvent(new StorageEvent("storage", { key: SESSION_KEY }));
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { detail?: unknown };
    if (typeof body.detail === "string") return body.detail;
  } catch {
    /* response had no JSON body */
  }
  return fallback;
}

/**
 * OAuth2 password flow: `/auth/login` is form-encoded, then `/auth/me`
 * resolves the role used for routing and guarding.
 */
export async function login(email: string, password: string): Promise<Session> {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_URL}${API_ROUTES.auth.login}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? "Incorrect email or password."
        : await readError(res, "Sign-in failed. Try again.")
    );
  }
  const { access_token } = (await res.json()) as { access_token: string };

  const meRes = await fetch(`${API_URL}${API_ROUTES.auth.me}`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!meRes.ok) {
    throw new Error(
      meRes.status === 401
        ? "This account is inactive. Ask an administrator to activate it."
        : await readError(meRes, "Could not load your profile.")
    );
  }
  const me = (await meRes.json()) as Me;
  const session = sessionFromMe(me);
  setSession(session, access_token);
  return session;
}
