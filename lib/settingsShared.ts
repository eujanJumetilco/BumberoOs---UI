// Display preferences shared by the settings store (client) and the pre-paint script in the
// root layout (server). Keep this file free of "use client" so both can import the values.

export const SETTINGS_KEY = "bumberoos.settings";

export type ThemePref = "light" | "dark" | "system";
export type Density = "comfortable" | "compact";
export type TextSize = "sm" | "md" | "lg" | "xl";
export type LandingPage = "dashboard" | "incidents";
export type IncidentsFilter = "ALL" | "ONGOING" | "RESOLVED";
export type TimeFormat = "12h" | "24h";

/** Every timestamp is shown in Philippine time. The server stores and sends UTC. */
export const DISPLAY_TIMEZONE = "Asia/Manila";

export type Settings = {
  theme: ThemePref;
  density: Density;
  textSize: TextSize;
  highContrast: boolean;
  landingPage: LandingPage;
  incidentsFilter: IncidentsFilter;
  timeFormat: TimeFormat;
  /** Pop-ups show the notification text. When off they only say that something new arrived. */
  showPreviews: boolean;
  /** Pop-ups and bell entries for newly reported incidents. */
  notifyReports: boolean;
  /** Pop-ups and bell entries for newly added events. */
  notifyEvents: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  density: "comfortable",
  textSize: "md",
  highContrast: false,
  landingPage: "dashboard",
  incidentsFilter: "ALL",
  timeFormat: "24h",
  showPreviews: true,
  notifyReports: true,
  notifyEvents: true,
};

/**
 * Runs synchronously in <head> so the saved theme is on <html> before the first paint.
 * Must stay in step with applySettings() in settings.ts.
 */
export const PRE_PAINT_SCRIPT = `(function(){try{var d=document.documentElement,s={};try{s=JSON.parse(localStorage.getItem(${JSON.stringify(
  SETTINGS_KEY,
)})||"{}")||{}}catch(e){}var t=s.theme||"system";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.setAttribute("data-theme",t);d.setAttribute("data-density",s.density||"comfortable");d.setAttribute("data-text",s.textSize||"md");d.setAttribute("data-contrast",s.highContrast?"high":"normal")}catch(e){}})()`;