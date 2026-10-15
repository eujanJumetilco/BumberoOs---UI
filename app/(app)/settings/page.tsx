"use client";
import { useState } from "react";
import InventoryRulesPanel from "@/components/InventoryRulesPanel";
import UserManagement from "@/components/UserManagement";
import { fmtDateTime, nowUtc } from "@/lib/api";
import { useAccount } from "@/lib/auth";
import {
  resetSettings, updateSettings, useSettings,
  type Settings,
} from "@/lib/settings";

type Tab = "appearance" | "preferences" | "inventory" | "users";

// Kept in sessionStorage so the tab survives the remount that happens when the time format changes.
const TAB_KEY = "bumberoos.settingsTab";
const TABS: Tab[] = ["appearance", "preferences", "inventory", "users"];
function savedTab(): Tab {
  try {
    const t = sessionStorage.getItem(TAB_KEY) as Tab | null;
    if (t && TABS.includes(t)) return t;
  } catch { /* storage unavailable */ }
  return "appearance";
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <h2 className="font-bold">{title}</h2>
      {hint && <p className="mb-3 text-sm text-gray-500">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t py-3 first:border-t-0">
      <div className="max-w-md">
        <p className="text-sm font-semibold">{label}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

/** Segmented single-choice control. */
function Choice<T extends string>({
  value, options, onChange,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex overflow-hidden rounded border text-sm" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 ${value === o.value ? "bg-red-700 font-semibold text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-red-700" : "bg-gray-300"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-5.5" : "left-0.5"}`} />
    </button>
  );
}

function Appearance({ s }: { s: Settings }) {
  return (
    <div className="space-y-6">
      <Section title="Theme">
        <Row label="Color mode" hint="System follows the device's light or dark setting.">
          <Choice value={s.theme} onChange={(theme) => updateSettings({ theme })}
            options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }]} />
        </Row>
        <Row label="High contrast" hint="Maximum text and border contrast with bold focus outlines. Suits bright or distant screens.">
          <Toggle label="High contrast" checked={s.highContrast} onChange={(highContrast) => updateSettings({ highContrast })} />
        </Row>
      </Section>
      <Section title="Layout and text">
        <Row label="Density" hint="Compact fits more on screen; comfortable is easier to tap on a tablet.">
          <Choice value={s.density} onChange={(density) => updateSettings({ density })}
            options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]} />
        </Row>
        <Row label="Text size" hint="Scales all text and spacing. Larger sizes help on a big monitor viewed from a distance.">
          <Choice value={s.textSize} onChange={(textSize) => updateSettings({ textSize })}
            options={[
              { value: "sm", label: "Small" }, { value: "md", label: "Medium" },
              { value: "lg", label: "Large" }, { value: "xl", label: "Extra large" },
            ]} />
        </Row>
      </Section>
    </div>
  );
}

function Preferences({ s }: { s: Settings }) {
  const sample = nowUtc();
  return (
    <div className="space-y-6">
      <Section title="Navigation">
        <Row label="Landing page" hint="Where you arrive after logging in.">
          <Choice value={s.landingPage} onChange={(landingPage) => updateSettings({ landingPage })}
            options={[{ value: "dashboard", label: "Dashboard" }, { value: "incidents", label: "Incidents" }]} />
        </Row>
        <Row label="Default incidents filter" hint="Which incidents the Incidents page lists when you open it.">
          <Choice value={s.incidentsFilter} onChange={(incidentsFilter) => updateSettings({ incidentsFilter })}
            options={[{ value: "ALL", label: "All" }, { value: "ONGOING", label: "Ongoing" }, { value: "RESOLVED", label: "Resolved" }]} />
        </Row>
      </Section>
      <Section title="Date and time" hint="Applies to every timestamp, including incident timelines.">
        <Row label="Time format">
          <Choice value={s.timeFormat} onChange={(timeFormat) => updateSettings({ timeFormat })}
            options={[{ value: "24h", label: "24-hour" }, { value: "12h", label: "12-hour" }]} />
        </Row>
        <Row label="Timezone" hint="Always Philippine time (Asia/Manila). Times are stored in UTC and converted for display.">
          <span className="text-sm font-semibold">Philippine Time (UTC+8)</span>
        </Row>
        <p className="border-t pt-3 text-sm text-gray-600">Preview: <span className="font-semibold">{fmtDateTime(sample)}</span></p>
      </Section>
    </div>
  );
}

export default function SettingsPage() {
  const account = useAccount();
  const s = useSettings();
  const [tab, setTabState] = useState<Tab>(savedTab);
  const setTab = (t: Tab) => {
    try { sessionStorage.setItem(TAB_KEY, t); } catch { /* storage unavailable */ }
    setTabState(t);
  };
  const isAdmin = account?.role === "ADMIN";

  const tabs: { key: Tab; label: string }[] = [
    { key: "appearance", label: "Appearance" },
    { key: "preferences", label: "Preferences" },
    { key: "inventory", label: "Inventory Rules" },
    ...(isAdmin ? [{ key: "users" as const, label: "User Management" }] : []),
  ];
  const active = tabs.some((t) => t.key === tab) ? tab : "appearance";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-600">Display preferences are saved in this browser only.</p>
        </div>
        <button onClick={() => confirm("Reset all display preferences to their defaults?") && resetSettings()}
          className="rounded border px-3 py-1.5 text-sm">Reset to defaults</button>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${active === t.key
              ? "border-red-700 font-semibold text-red-700" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className={active === "users" ? "" : "max-w-3xl"}>
        {active === "appearance" && <Appearance s={s} />}
        {active === "preferences" && <Preferences s={s} />}
        {active === "inventory" && <InventoryRulesPanel canEdit={isAdmin} />}
        {active === "users" && isAdmin && <UserManagement />}
      </div>
    </div>
  );
}
