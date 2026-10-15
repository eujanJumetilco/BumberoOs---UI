import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { fmtDateTime, label, type Incident } from "@/lib/api";

/** What is deployed on one incident, for the dashboard map. Active assignments only while ongoing. */
export default function IncidentMapPanel({ incident }: { incident: Incident }) {
  const ongoing = incident.status === "ONGOING";
  const staff = ongoing ? incident.staff.filter((s) => !s.releasedAt) : incident.staff;
  const items = ongoing ? incident.items.filter((i) => !i.releasedAt) : incident.items;

  return (
    <div className="rounded-lg border bg-white p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <StatusBadge tone={ongoing ? "red" : "green"}>{label(incident.status)}</StatusBadge>
        {incident.alarmLevel && <StatusBadge tone="amber">{label(incident.alarmLevel)}</StatusBadge>}
        <span className="text-xs text-gray-500">INC-{incident.id}</span>
      </div>
      <h2 className="text-lg font-bold">{incident.incidentType}</h2>
      <p className="text-sm text-gray-600">{incident.location}</p>
      <p className="mb-3 text-xs text-gray-500">
        Reported {fmtDateTime(incident.dateTimeReported)} by {incident.reportedBy}
      </p>

      <dl className="mb-3 space-y-1 text-sm">
        <div className="flex justify-between gap-2"><dt className="text-gray-500">Arrived on scene</dt>
          <dd>{incident.arrivedAt ? fmtDateTime(incident.arrivedAt) : "—"}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-gray-500">BFP commander</dt>
          <dd className="text-right">{incident.commanderName ?? "—"}</dd></div>
      </dl>

      <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">
        {ongoing ? "Deployed staff" : "Staff (released)"} ({staff.length})
      </h3>
      <ul className="mb-3 space-y-1 text-sm">
        {staff.map((s) => (
          <li key={s.staffId} className="rounded bg-gray-50 px-2 py-1">
            {s.name}
            <span className="text-xs text-gray-500">{s.badgeNumber ? ` · ID ${s.badgeNumber}` : ""}{s.role ? ` · ${s.role}` : ""}</span>
          </li>
        ))}
        {staff.length === 0 && <li className="text-gray-500">No one.</li>}
      </ul>

      <h3 className="mb-1 text-xs font-semibold uppercase text-gray-500">
        {ongoing ? "Deployed equipment" : "Equipment (returned)"} ({items.length})
      </h3>
      <ul className="mb-4 space-y-1 text-sm">
        {items.map((i) => (
          <li key={i.itemId} className="rounded bg-gray-50 px-2 py-1">{i.name} × {i.quantity}</li>
        ))}
        {items.length === 0 && <li className="text-gray-500">None.</li>}
      </ul>

      <Link href="/incidents" className="text-sm font-semibold text-red-700">Open Incident Management →</Link>
    </div>
  );
}
