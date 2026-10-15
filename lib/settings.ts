"use client";
import { useSyncExternalStore } from "react";
import { DEFAULT_SETTINGS, SETTINGS_KEY, type Settings } from "./settingsShared";

export type { Settings } from "./settingsShared";

// Display preferences live in localStorage, per browser: they follow the dispatch station's
// screen rather than the person signed in.
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Settings } = { raw: null, value: DEFAULT_SETTINGS };

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(v as T) ? (v as T) : fallback;

function parse(raw: string | null): Settings {
  let p: Partial<Record<keyof Settings, unknown>> = {};
  try { p = raw ? JSON.parse(raw) ?? {} : {}; } catch { p = {}; }
  const d = DEFAULT_SETTINGS;
  return {
    theme: oneOf(p.theme, ["light", "dark", "system"], d.theme),
    density: oneOf(p.density, ["comfortable", "compact"], d.density),
    textSize: oneOf(p.textSize, ["sm", "md", "lg", "xl"], d.textSize),
    highContrast: typeof p.highContrast === "boolean" ? p.highContrast : d.highContrast,
    landingPage: oneOf(p.landingPage, ["dashboard", "incidents"], d.landingPage),
    incidentsFilter: oneOf(p.incidentsFilter, ["ALL", "ONGOING", "RESOLVED"], d.incidentsFilter),
    timeFormat: oneOf(p.timeFormat, ["12h", "24h"], d.timeFormat),
  };
}

/** Current settings. Safe to call anywhere on the client; falls back to defaults when storage is unavailable. */
export function getSettings(): Settings {
  let raw: string | null = null;
  try { raw = localStorage.getItem(SETTINGS_KEY); } catch { /* storage unavailable */ }
  if (raw !== cache.raw) cache = { raw, value: parse(raw) };
  return cache.value;
}

export function updateSettings(patch: Partial<Settings>) {
  const next = { ...getSettings(), ...patch };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  // Keep working for this session even if the write failed.
  cache = { raw: JSON.stringify(next), value: next };
  listeners.forEach((l) => l());
}

export function resetSettings() {
  try { localStorage.removeItem(SETTINGS_KEY); } catch { /* storage unavailable */ }
  cache = { raw: null, value: DEFAULT_SETTINGS };
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => { listeners.delete(cb); window.removeEventListener("storage", cb); };
};

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULT_SETTINGS);
}

/** Mirrors PRE_PAINT_SCRIPT: puts the settings on <html> where globals.css reads them. */
export function applySettings(s: Settings) {
  const root = document.documentElement;
  const dark = s.theme === "dark" || (s.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  root.setAttribute("data-theme", dark ? "dark" : "light");
  root.setAttribute("data-density", s.density);
  root.setAttribute("data-text", s.textSize);
  root.setAttribute("data-contrast", s.highContrast ? "high" : "normal");
}

export const landingPath = (s: Settings) => (s.landingPage === "incidents" ? "/incidents" : "/dashboard");
