"use client";
import { useLayoutEffect } from "react";
import { applySettings, useSettings } from "@/lib/settings";

/**
 * Keeps <html> in step with the saved settings. The inline script in the root layout covers the
 * first paint; this covers changes, the OS theme flipping while theme is "system", and React's
 * dev-mode remount, which clears attributes the script set.
 */
export default function SettingsApplier() {
  const settings = useSettings();

  useLayoutEffect(() => {
    applySettings(settings);
    if (settings.theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applySettings(settings);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [settings]);

  return null;
}
