"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import IncidentMapPanel from "@/components/IncidentMapPanel";
import ErrorBanner from "@/components/ErrorBanner";
import ReportIncidentModal from "@/components/ReportIncidentModal";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import CreateEventButton from "@/components/CreateEventButton";
import { fmtDateTime, label, type Staff } from "@/lib/api";
import { hasPosition } from "@/lib/map";
import { invalidate, useResource } from "@/lib/store";

const IncidentMap = dynamic(() => import("@/components/IncidentMap"), {
  ssr: false,
  loading: () => <div className="flex h-96 items-center justify-center text-sm text-gray-500">Loading map...</div>,
});

const availTones = { AVAILABLE: "green", PARTIALLY_DISPATCHED: "amber", DISPATCHED: "red", UNAVAILABLE: "gray" } as const;

export default function DashboardPage() {
  const router = useRouter();
  const [showReport, setShowReport] = useState(false);
  const [mapSelectedId, setMapSelectedId] = useState<number | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const staffRes = useResource("staff");
  const itemsRes = useResource("items");
  const incidentsRes = useResource("incidents");
  const alertsRes = useResource("alerts");
  const staff = staffRes.data, items = itemsRes.data, incidents = incidentsRes.data, alerts = alertsRes.data;
  const error = staffRes.error ?? itemsRes.error ?? incidentsRes.error ?? alertsRes.error;

  useEffect(() => {
    // Para sa ?report=1 URL
    if (new URLSearchParams(window.location.search).get("report")) {
      setShowReport(true);
      router.replace("/dashboard");
    }

    // Para sa Quick Dispatch button mula sa Sidebar
    const handleOpenModal = () => setShowReport(true);
    window.addEventListener("openReportModal", handleOpenModal);
    
    return () => window.removeEventListener("openReportModal", handleOpenModal);
  }, [router]);

  const count = (a: Staff["availability"]) => staff.filter((p) => p.availability === a).length;
  const good = items.filter((i) => i.condition === "GOOD").length;
  const damaged = items.filter((i) => i.condition === "DAMAGED").length;
  const retired = items.filter((i) => i.condition === "RETIRED").length;
  const ready = items.filter((i) => i.condition === "GOOD" && i.quantityAvailable > 0).length;
  const readyPct = items.length ? Math.round((ready / items.length) * 1000) / 10 : 0;

  const sorted = [...incidents].sort((a, b) => b.dateTimeReported.localeCompare(a.dateTimeReported));
  const ongoing = sorted.filter((i) => i.status === "ONGOING");
  const active = ongoing[0];
  const placed = incidents.filter(hasPosition).filter((i) => showResolved || i.status === "ONGOING");
  const unplaced = ongoing.filter((i) => !hasPosition(i));
  const mapSelected = incidents.find((i) => i.id === mapSelectedId) ?? null;
  const vehicles = items.filter((i) => i.category === "ENGINE" || i.category === "AMBULANCE");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between rounded-lg border bg-white p-5">
        <div>
          <p className="text-xs font-semibold uppercase text-red-700">Station Briefing</p>
          <h1 className="text-2xl font-bold">BumberoOS Command</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-600">
            {staff.length} personnel rostered, {count("AVAILABLE")} available to dispatch.
            {" "}{vehicles.length} apparatus tracked.
          </p>
        </div>
        <div className="flex gap-2">
          <CreateEventButton />
          <button onClick={() => setShowReport(true)}
            className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white">+ Report Incident</button>
        </div>
      </div>

      <ErrorBanner message={error} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Staff Readiness">
          <p className="text-3xl font-bold">{staff.length} <span className="text-base font-normal text-gray-500">Personnel</span></p>
          <p className="mt-1 text-xs text-gray-500">
            Available {count("AVAILABLE")} · Dispatched {count("DISPATCHED")} · Unavailable {count("UNAVAILABLE")}
          </p>
        </StatCard>
        <StatCard title="Equipment & Fleet">
          <p className="text-3xl font-bold">{readyPct}% <span className="text-base font-normal text-gray-500">Ready</span></p>
          <p className="mt-1 text-xs text-gray-500">Good {good} · Damaged {damaged} · Retired {retired}</p>
        </StatCard>
        <StatCard title="Active Incidents">
          <p className={`text-3xl font-bold ${ongoing.length ? "text-red-700" : ""}`}>
            {ongoing.length} <span className="text-base font-normal">Ongoing</span>
          </p>
          <p className="mt-1 text-xs text-gray-500">{incidents.length - ongoing.length} resolved in total</p>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold">Incident Map</h2>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
              Show resolved
            </label>
          </div>
          <IncidentMap incidents={placed} selectedId={mapSelectedId} onSelect={setMapSelectedId} />
          <p className="mt-2 text-xs text-gray-500">
            {placed.length === 0
              ? "No incidents with a map location. Pin one when reporting, or from Incident Management."
              : "Click a red circle to see what is deployed there."}
          </p>
          {unplaced.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Not on the map (no location pinned):{" "}
              {unplaced.map((i, n) => (
                <span key={i.id}>
                  {n > 0 && ", "}
                  <button onClick={() => setMapSelectedId(i.id)} className="text-red-700 underline">
                    INC-{i.id} {i.incidentType}
                  </button>
                </span>
              ))}
            </p>
          )}
        </div>
        <div className="self-start">
          {mapSelected ? <IncidentMapPanel incident={mapSelected} /> : (
            <div className="rounded-lg border bg-white p-5 text-sm text-gray-500">
              Select an incident on the map to see who and what is deployed.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-red-200 bg-white p-5">
            {active ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{active.incidentType} – {active.location}</h2>
                  <StatusBadge tone="red">{active.alarmLevel ? label(active.alarmLevel) : "Ongoing"}</StatusBadge>
                </div>
                <p className="text-sm text-gray-500">
                  Reported by {active.reportedBy} · {fmtDateTime(active.dateTimeReported)}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded bg-gray-50 p-3">
                    <p className="font-semibold">Deployed Staff</p>
                    <p>{active.staff.filter((s) => !s.releasedAt).map((s) => s.name).join(", ") || "None"}</p>
                  </div>
                  <div className="rounded bg-gray-50 p-3">
                    <p className="font-semibold">Deployed Equipment</p>
                    <p>{active.items.filter((i) => !i.releasedAt).map((i) => `${i.name} × ${i.quantity}`).join(", ") || "None"}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <button onClick={() => router.push("/incidents")}
                    className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white">Open Incident Management</button>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-600">No ongoing incidents. The station is ready.</p>
            )}
          </div>

          <div className="rounded-lg border bg-white p-5">
            <div className="mb-3 flex justify-between">
              <h2 className="font-bold">Recent Incident Log</h2>
              <Link href="/incidents" className="text-sm text-red-700">View Full Log History</Link>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr><th className="py-2">Reported</th><th>ID</th><th>Event Type</th><th>Location</th><th>Status</th></tr>
              </thead>
              <tbody>
                {sorted.slice(0, 8).map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{fmtDateTime(r.dateTimeReported)}</td>
                    <td>INC-{r.id}</td>
                    <td>{r.incidentType}</td>
                    <td>{r.location}</td>
                    <td><StatusBadge tone={r.status === "ONGOING" ? "red" : "green"}>{label(r.status)}</StatusBadge></td>
                  </tr>
                ))}
                {sorted.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-500">No incidents yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6 self-start">
          <div className="rounded-lg border bg-white p-5">
            <div className="mb-3 flex justify-between">
              <h2 className="font-bold">Equipment Alerts{alerts.length > 0 && ` (${alerts.length})`}</h2>
              <Link href="/inventory" className="text-sm text-red-700">Inventory</Link>
            </div>
            <ul className="space-y-2 text-sm">
              {alerts.slice(0, 6).map((a, n) => (
                <li key={n} className="flex items-start gap-2">
                  <StatusBadge tone={a.severity === "HIGH" ? "red" : "amber"}>{a.severity === "HIGH" ? "Urgent" : "Soon"}</StatusBadge>
                  <span>{a.message}</span>
                </li>
              ))}
              {alerts.length > 6 && <li className="text-xs text-gray-500">and {alerts.length - 6} more in Inventory.</li>}
              {alerts.length === 0 && <li className="text-gray-500">Nothing needs attention.</li>}
            </ul>
          </div>

          <div className="rounded-lg border bg-white p-5">
            <h2 className="mb-3 font-bold">Apparatus Bay Status</h2>
            <ul className="space-y-3">
              {vehicles.map((v) => (
                <li key={v.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{v.name}</p>
                    <p className="text-xs text-gray-500">{label(v.category)} · {v.serialNumber ?? "no serial"}</p>
                  </div>
                  <StatusBadge tone={availTones[v.availability]}>{label(v.availability)}</StatusBadge>
                </li>
              ))}
              {vehicles.length === 0 && <li className="text-sm text-gray-500">No engines or ambulances tracked.</li>}
            </ul>
          </div>
        </div>
      </div>

      {showReport && (
        <ReportIncidentModal onClose={() => setShowReport(false)}
          onCreated={() => { setShowReport(false); void invalidate(); }} />
      )}
    </div>
  );
}