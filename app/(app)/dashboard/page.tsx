"use client";

import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { useRouter } from "next/navigation";
import { useState } from "react";

const bays = [
  { unit: "Engine 1", detail: "Crew: 4", status: "Dispatched", tone: "red" as const },
  { unit: "Ladder 1", detail: "Crew: 4", status: "On Scene", tone: "amber" as const },
  { unit: "Rescue 2", detail: "Crew: 3", status: "Available", tone: "green" as const },
  { unit: "Medic 2", detail: "Crew: 2", status: "Available", tone: "green" as const },
];

const initialIncidentLog = [
  { time: "14:22:10", id: "INC-2025-094", type: "Structure Fire (Commercial)", apparatus: "Engine 1, Ladder 1", status: "Dispatched", tone: "red" as const },
  { time: "11:45:30", id: "ETA-LOG-114", type: "Shift B Medical Aid", apparatus: "Medic 2", status: "Completed", tone: "green" as const },
  { time: "09:12:05", id: "INC-2025-093", type: "Hazmat Response", apparatus: "Rescue 2", status: "Completed", tone: "green" as const },
];

const contacts = [
  { name: "Metro Fire Dispatch HQ", role: "Primary Relay Line" },
  { name: "Water Dept. Supervisory", role: "Main Pressure Control" },
  { name: "Harbor Police Division", role: "Traffic Redirect Control" },
];

export default function DashboardPage() {
  const router = useRouter();
    const [showIncidentForm, setShowIncidentForm] = useState(false);

    const [logs, setLogs] = useState(initialIncidentLog);

  const [incident, setIncident] = useState({
    location: "",
    type: "",
    description: "",
  });
 return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-start justify-between rounded-lg border bg-white p-5">
      <div>
        <p className="text-xs font-semibold uppercase text-red-700">
          Station Briefing
        </p>

        <h1 className="text-2xl font-bold">
          Station 4 – Metro Central
        </h1>

        <p className="mt-1 max-w-xl text-sm text-gray-600">
          Command station calibrated. 3 apparatus bays staged, 24 personnel
          rostered for this shift.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            const confirmed = window.confirm(
              "Do you want to change the apparatus status?"
            );

            if (confirmed) {
              alert("Apparatus status updated successfully.");
            }
          }}
          className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Roll Out / Back In
 </button>

        <button
          onClick={() => setShowIncidentForm(true)}
          className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white"
        >
            + Report Incident
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Staff Readiness">
          <p className="text-3xl font-bold">24 <span className="text-base font-normal text-gray-500">Personnel</span></p>
          <p className="mt-1 text-xs text-gray-500">Available · Unavailable · On Duty</p>
        </StatCard>
        <StatCard title="Equipment & Fleet">
          <p className="text-3xl font-bold">95.4% <span className="text-base font-normal text-gray-500">Ready</span></p>
          <p className="mt-1 text-xs text-gray-500">Good 42 · Repair 2 · Retired 0</p>
        </StatCard>
        <StatCard title="Active Alarms">
          <p className="text-3xl font-bold text-red-700">1 <span className="text-base font-normal">Ongoing Alarm</span></p>
          <p className="mt-1 text-xs text-gray-500">Avg response: 3 min</p>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Active incident */}
          <div className="rounded-lg border border-red-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">442 Maple Ave, Industrial Harbor District</h2>
              <StatusBadge tone="red">Active</StatusBadge>
            </div>
            <p className="text-sm text-gray-500">Incident Commander: Lt. Marcus Gomez</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded bg-gray-50 p-3">
                <p className="font-semibold">Responding Units</p>
                <p>Engine 1 · Ladder 1 · Medic 2</p>
              </div>
              <div className="rounded bg-gray-50 p-3">
                <p className="font-semibold">Hydrant Status</p>
                <p>Pressure OK</p>
              </div>
              <div className="rounded bg-gray-50 p-3">
                <p className="font-semibold">Resources</p>
                <p>Water supply established</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button  onClick={() => {
  const confirmed = window.confirm(
    "Request a second mutual aid unit?"
  );

  if (confirmed) {
    alert("Second mutual aid request sent to dispatch.");
    }
  }}
  className="rounded border px-4 py-2 text-sm"
>
  Request Second Mutual Aid
</button>
              <button onClick={() => router.push("/incidents")}
  className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white"
>
  Open Tactical Incident Log
</button>
            </div>
          </div>

          {/* Dispatch log */}
          <div className="rounded-lg border bg-white p-5">
            <div className="mb-3 flex justify-between">
              <h2 className="font-bold">Recent Brigade Station Dispatch & Log</h2>
              <a href="/incidents" className="text-sm text-red-700">View Full Log History</a>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2">Timestamp</th><th>Identifier</th><th>Event Type</th>
                  <th>Apparatus</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{r.time}</td>
                    <td>{r.id}</td>
                    <td>{r.type}</td>
                    <td>{r.apparatus}</td>
                    <td><StatusBadge tone={r.tone}>{r.status}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 font-bold">Apparatus Bay Status</h2>
            <ul className="space-y-3">
              {bays.map((b) => (
                <li key={b.unit} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{b.unit}</p>
                    <p className="text-xs text-gray-500">{b.detail}</p>
                  </div>
                  <StatusBadge tone={b.tone}>{b.status}</StatusBadge>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 font-bold">Hydrant & District Grid</h2>
            <div className="mb-3 h-32 rounded bg-gray-200" />
            <button   onClick={() => router.push("/incidents")}
              className="w-full rounded bg-red-700 py-2 text-sm font-semibold text-white"
            >
              Launch Tactical GPS Map
            </button>
          </div>

          <div className="rounded-lg border bg-white p-5">
  <h2 className="mb-3 font-bold">Emergency Command Direct</h2>

  <ul className="space-y-2 text-sm">
    {contacts.map((c) => (
      <li key={c.name}>
        <button
          type="button"
          onClick={() => {
            alert(`Contacting ${c.name}...`);
          }}
          className="w-full rounded p-2 text-left transition hover:bg-gray-50"
        >
          <p className="font-semibold">{c.name}</p>
          <p className="text-xs text-gray-500">{c.role}</p>
        </button>
      </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
   {showIncidentForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">
              Report New Incident
            </h2>

            <div className="space-y-4">

              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Location
                </label>

                <input
                  type="text"
                  value={incident.location}
                  onChange={(e) =>
                    setIncident({
                      ...incident,
                      location: e.target.value,
                    })
                  }
                  className="w-full rounded border p-2"
                  placeholder="Enter incident location"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Incident Type
                </label>

                <select
                  value={incident.type}
                  onChange={(e) =>
                    setIncident({
                      ...incident,
                      type: e.target.value,
                    })
                  }
                  className="w-full rounded border p-2"
                >
                  <option value="">Select type</option>
                  <option value="Structure Fire">Structure Fire</option>
                  <option value="Medical Emergency">
                    Medical Emergency
                  </option>
                  <option value="Hazmat">Hazmat</option>
                  <option value="Vehicle Fire">Vehicle Fire</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold">
                  Description
                </label>

                <textarea
                  value={incident.description}
                  onChange={(e) =>
                    setIncident({
                      ...incident,
                      description: e.target.value,
                    })
                  }
                  className="w-full rounded border p-2"
                  placeholder="Describe the incident"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">

                <button
                  onClick={() => setShowIncidentForm(false)}
                  className="rounded border px-4 py-2"
                >
                  Cancel
                </button>

                <button
                   onClick={() => {
    if (!incident.location || !incident.type) {
      alert("Please enter the location and incident type.");
      return;
    }

    const newLog = {
      time: new Date().toLocaleTimeString("en-US", {
        hour12: false,
      }),
      id: `INC-${Date.now()}`,
      type: incident.type,
      apparatus: "Pending Assignment",
      status: "Dispatched",
      tone: "red" as const,
    };

    setLogs([newLog, ...logs]);

    setIncident({
      location: "",
      type: "",
      description: "",
    });

    setShowIncidentForm(false);
  }}
  className="rounded bg-red-700 px-4 py-2 font-semibold text-white"
>
  Save Incident
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
