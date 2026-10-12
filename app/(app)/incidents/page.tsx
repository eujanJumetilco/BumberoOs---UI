"use client";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";

const units = [
  { name: "Engine 4", status: "On Scene", tone: "red" as const },
  { name: "Battalion 1", status: "On Scene", tone: "red" as const },
  { name: "Squad 4 (Heavy)", status: "En Route", tone: "amber" as const },
  { name: "Medic 14", status: "Available", tone: "green" as const },
];

const initialFeed = [
  { time: "19:48:12", title: "Engine 4 On Scene", text: "Engine 4 arrived at 442 Maple Ave. Smoke showing from second floor." },
  { time: "19:46:30", title: "Rescue 2 Dispatched", text: "Rescue 2 assigned for rescue and primary ventilation." },
  { time: "19:41:05", title: "911 Call Origin", text: "Caller reports heavy smoke from a two-story residential building." },
];

const codes = [1, 2, 3];

export default function IncidentsPage() {
  const [code, setCode] = useState(2);
  const [feed, setFeed] = useState(initialFeed);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [alarmSent, setAlarmSent] = useState(false);
  const [incidentStatus, setIncidentStatus] = useState<
  "Active" | "En Route" | "On Scene" | "Resolved"
>("Active");

  const now = () => new Date().toLocaleTimeString("en-GB");

  const addNote = () => {
    if (!note.trim()) return;
    setNotes([note, ...notes]);
    setFeed([{ time: now(), title: "Command Note", text: note }, ...feed]);
    setNote("");
  };

  const sendAlarm = () => {
    setAlarmSent(true);
    setFeed([{ time: now(), title: "3rd Alarm Requested", text: "Transmitted to dispatch." }, ...feed]);
  };

  return (
    <div className="space-y-6">
      {/* Status strip */}
      <div className="flex flex-wrap items-center gap-6 rounded-lg border bg-white px-5 py-3 text-sm">
        <div>
          <p className="text-xs uppercase text-gray-500">Active Fire</p>
          <p className="font-bold text-red-700">1 Active Critical Alarm</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500">Resolved Today</p>
          <p className="font-bold">3 Resolved</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500">Status</p>
          <select
            value={incidentStatus}
            onChange={(e) =>
              setIncidentStatus(
                e.target.value as "Active" | "En Route" | "On Scene" | "Resolved"
              )
            }
            className="rounded border px-3 py-1 text-sm font-semibold"
          >
            <option value="Active">Active</option>
            <option value="En Route">En Route</option>
            <option value="On Scene">On Scene</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left / main */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border bg-white p-5">
            <div className="mb-2 flex items-center gap-2">
              <StatusBadge tone="red">INC-2025-094</StatusBadge>
              <StatusBadge tone="amber">Severity: Code {code}</StatusBadge>
            </div>
            <h1 className="text-2xl font-bold">2nd Alarm Structure Fire – 442 Maple Ave</h1>
            <p className="text-sm text-gray-500">
              Reported at 19:41 · Commercial/Mixed-Use District
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="text-xs uppercase text-gray-500">Assigned Units:</span>
              {units.slice(0, 3).map((u) => (
                <StatusBadge key={u.name} tone="gray">{u.name}</StatusBadge>
              ))}
            </div>
<div className="relative mt-4 h-56 overflow-hidden rounded bg-slate-300">

  <div className="absolute left-0 top-24 h-8 w-full rotate-[-8deg] bg-slate-500" />
  <div className="absolute left-1/2 top-0 h-full w-8 rotate-[12deg] bg-slate-500" />


  <div className="absolute left-[58%] top-[38%] flex flex-col items-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-xl text-white shadow-lg">
      🔥
    </div>
    <span className="mt-1 rounded bg-white px-2 py-1 text-xs font-semibold shadow">
      Incident
    </span>
  </div>
  <div className="absolute left-[30%] top-[55%] flex flex-col items-center">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-700 text-sm text-white shadow">
      🚒
    </div>
    <span className="mt-1 rounded bg-white px-2 py-1 text-xs font-semibold shadow">
      Engine 4
    </span>
  </div>
  <div className="absolute left-[72%] top-[65%] flex flex-col items-center">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-sm text-white shadow">
      🚒
    </div>
    <span className="mt-1 rounded bg-white px-2 py-1 text-xs font-semibold shadow">
      Rescue 2
    </span>
  </div>
  <div className="absolute left-[18%] top-[25%] flex flex-col items-center">
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-sm text-white shadow">
      🚑
    </div>
    <span className="mt-1 rounded bg-white px-2 py-1 text-xs font-semibold shadow">
      Medic 14
    </span>
  </div>
  <div className="absolute left-3 top-3 rounded bg-white/90 px-3 py-1 text-xs font-bold shadow">
    TACTICAL MAP • LIVE
  </div>
</div>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 text-sm">
              {["Fire Behavior", "Hydrant Active", "Water Hazard", "Evacuation"].map((t) => (
                <div key={t} className="rounded bg-gray-50 p-3 text-center font-medium">{t}</div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 font-bold">Chronological Dispatch Feed</h2>
            <ul className="space-y-3">
              {feed.map((f, i) => (
                <li key={i} className="flex gap-4 border-t pt-3 first:border-t-0 first:pt-0">
                  <span className="w-20 shrink-0 text-xs text-gray-500">{f.time}</span>
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-sm text-gray-600">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 font-bold">Station 04 Apparatus</h2>
            <ul className="space-y-3">
              {units.map((u) => (
                <li key={u.name} className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{u.name}</span>
                  <StatusBadge tone={u.tone}>{u.status}</StatusBadge>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 font-bold">Incident Code & Escalation</h2>
            <div className="flex gap-2">
              {codes.map((c) => (
                <button
                  key={c}
                  onClick={() => setCode(c)}
                  className={`flex-1 rounded border py-2 text-sm font-semibold ${
                    code === c ? "bg-red-700 text-white" : "bg-white text-gray-700"
                  }`}
                >
                  Code {c}
                </button>
              ))}
            </div>
            <button
              onClick={sendAlarm}
              disabled={alarmSent}
              className="mt-3 w-full rounded border border-red-700 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              {alarmSent ? "3rd Alarm Requested" : "Transmit 3rd Alarm Request"}
            </button>
          </div>

          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 font-bold">Tactical Dispatch Notes</h2>
            {notes.length === 0 && (
              <p className="mb-3 text-sm text-gray-500">No notes yet.</p>
            )}
            <ul className="mb-3 space-y-2 text-sm">
              {notes.map((n, i) => (
                <li key={i} className="rounded bg-gray-50 p-2">{n}</li>
              ))}
            </ul>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Type a note..."
              className="w-full rounded border p-2 text-sm"
              rows={3}
            />
            <button
              onClick={addNote}
              className="mt-2 w-full rounded bg-red-700 py-2 text-sm font-semibold text-white"
            >
              Append Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}