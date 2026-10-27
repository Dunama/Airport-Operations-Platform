import { useSyncExternalStore } from "react";

import { THEME_KEY as KEY } from "./theme-script";

export type Theme = "light" | "dark";
const listeners = new Set<() => void>();

function stored(): Theme | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

function current(): Theme {
  return (
    stored() ??
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const sync = () => {
    apply(current());
    onChange();
  };
  media.addEventListener("change", sync);
  window.addEventListener("storage", sync);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", sync);
    window.removeEventListener("storage", sync);
  };
}

export function setTheme(theme: Theme) {
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
  apply(theme);
  listeners.forEach((l) => l());
}

export function useTheme() {
  const theme = useSyncExternalStore<Theme>(subscribe, current, () => "light");
  return {
    theme,
    setTheme,
    toggle: () => setTheme(theme === "dark" ? "light" : "dark"),
  };
}
