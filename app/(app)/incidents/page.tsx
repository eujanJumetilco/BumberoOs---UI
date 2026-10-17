"use client";
import { useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import Modal, { inputCls } from "@/components/Modal";
import dynamic from "next/dynamic";
import CommandPanel from "@/components/CommandPanel";
import ReportIncidentModal from "@/components/ReportIncidentModal";
import StatusBadge from "@/components/StatusBadge";
import {
  ALARM_LEVELS, api, errMsg, fmtDateTime, fmtTime, label, nowUtc,
  type AlarmLevel, type IncidentStatus, type ItemCondition,
} from "@/lib/api";
import type { LatLng } from "@/lib/map";
import { getSettings } from "@/lib/settings";
import { invalidate, useResource } from "@/lib/store";

// Leaflet touches `window`, so the map only loads in the browser.
const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => <p className="mb-4 text-sm text-gray-500">Loading map...</p>,
});

type Filter = "ALL" | IncidentStatus;

export default function IncidentsPage() {
  const [filter, setFilter] = useState<Filter>(() => getSettings().incidentsFilter);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinDraft, setPinDraft] = useState<LatLng | null>(null);
  const [returns, setReturns] = useState<Record<number, ItemCondition | "">>({});
  const [staffPick, setStaffPick] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [itemPick, setItemPick] = useState("");
  const [itemQty, setItemQty] = useState(1);

  // The list plus whatever is free to dispatch (refetched after every action).
  const incidentsRes = useResource("incidents");
  const staffRes = useResource("availableStaff");
  const itemsRes = useResource("availableItems");
  const incidents = incidentsRes.data, availItems = itemsRes.data;
  const availStaff = staffRes.data.filter((p) => p.employed);
  const loadError = incidentsRes.error ?? staffRes.error ?? itemsRes.error;

  const visible = incidents
    .filter((i) => filter === "ALL" || i.status === filter)
    .sort((a, b) => b.dateTimeReported.localeCompare(a.dateTimeReported));
  const selected = incidents.find((i) => i.id === selectedId) ?? visible[0];
  const ongoing = incidents.filter((i) => i.status === "ONGOING");
  const open = selected?.status === "ONGOING";

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try { await fn(); await invalidate(); return true; }
    catch (e) { setError(errMsg(e)); return false; }
    finally { setBusy(false); }
  };

  const activeStaff = selected?.staff.filter((s) => !s.releasedAt) ?? [];
  const activeItems = selected?.items.filter((i) => !i.releasedAt) ?? [];

  const feed = selected ? [
    { at: selected.dateTimeReported, title: "Incident Reported", text: `${selected.incidentType} at ${selected.location} (reported by ${selected.reportedBy})` },
    ...selected.alarmHistory.map((a) => ({ at: a.raisedAt, title: `${label(a.alarmLevel)} Recorded`, text: "Alarm level logged." })),
    ...selected.staff.flatMap((s) => [
      { at: s.assignedAt, title: "Staff Dispatched", text: `${s.name}${s.role ? ` (${s.role})` : ""}` },
      ...(s.releasedAt ? [{ at: s.releasedAt, title: "Staff Released", text: s.name }] : []),
    ]),
    ...selected.items.flatMap((i) => [
      { at: i.assignedAt, title: "Equipment Dispatched", text: `${i.name} × ${i.quantity}` },
      ...(i.releasedAt ? [{ at: i.releasedAt, title: "Equipment Returned", text: `${i.name}${i.returnCondition ? ` — ${label(i.returnCondition)}` : ""}` }] : []),
    ]),
    ...(selected.arrivedAt ? [{ at: selected.arrivedAt, title: "Arrived on Scene", text: selected.commanderName ? `Reporting to ${selected.commanderName}` : "" }] : []),
    ...selected.commanderOrders.map((o) => ({ at: o.issuedAt, title: "Commander's Order", text: o.instruction })),
    ...(selected.underControlAt ? [{ at: selected.underControlAt, title: "Under Control", text: "" }] : []),
    ...(selected.fireOutAt ? [{ at: selected.fireOutAt, title: "Fire Out", text: "" }] : []),
    ...(selected.resolvedAt ? [{ at: selected.resolvedAt, title: "Resolved", text: "" }] : []),
  ].sort((a, b) => b.at.localeCompare(a.at)) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-6 rounded-lg border bg-white px-5 py-3 text-sm">
        <div>
          <p className="text-xs uppercase text-gray-500">Ongoing</p>
          <p className="font-bold text-red-700">{ongoing.length} Incident{ongoing.length === 1 ? "" : "s"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500">Resolved</p>
          <p className="font-bold">{incidents.length - ongoing.length} Resolved</p>
        </div>
        <button onClick={() => setShowReport(true)}
          className="ml-auto rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white">+ Report Incident</button>
      </div>

      <ErrorBanner message={error ?? loadError} onDismiss={() => setError(null)} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* List */}
        <div className="rounded-lg border bg-white p-5">
          <div className="mb-3 flex gap-2">
            {(["ALL", "ONGOING", "RESOLVED"] as Filter[]).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1 text-xs ${filter === f ? "bg-red-700 text-white" : "bg-white text-gray-700"}`}>
                {f === "ALL" ? "All" : label(f)}
              </button>
            ))}
          </div>
          <ul className="space-y-2">
            {visible.map((i) => (
              <li key={i.id}>
                <button onClick={() => setSelectedId(i.id)}
                  className={`w-full rounded border p-3 text-left hover:bg-gray-50 ${i.id === selected?.id ? "border-red-300 bg-red-50" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">#{i.id} {i.incidentType}</span>
                    <StatusBadge tone={i.status === "ONGOING" ? "red" : "green"}>{label(i.status)}</StatusBadge>
                  </div>
                  <p className="text-xs text-gray-500">{i.location} · {fmtDateTime(i.dateTimeReported)}</p>
                </button>
              </li>
            ))}
            {visible.length === 0 && <li className="text-sm text-gray-500">No incidents.</li>}
          </ul>
        </div>

        {/* Detail */}
        {selected ? (
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-lg border bg-white p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge tone="red">INC-{selected.id}</StatusBadge>
                <StatusBadge tone={selected.nature === "EMERGENCY" ? "amber" : "gray"}>{label(selected.nature)}</StatusBadge>
                <StatusBadge tone={open ? "red" : "green"}>{label(selected.status)}</StatusBadge>
                {selected.alarmLevel && <StatusBadge tone="amber">{label(selected.alarmLevel)}</StatusBadge>}
              </div>
              <h1 className="text-2xl font-bold">{selected.incidentType} – {selected.location}</h1>
              <p className="text-sm text-gray-500">
                Reported {fmtDateTime(selected.dateTimeReported)} by {selected.reportedBy}
                {selected.resolvedAt && ` · Resolved ${fmtDateTime(selected.resolvedAt)}`}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {selected.latitude != null ? "Pinned on the map." : "Not on the map yet."}{" "}
                <button onClick={() => {
                  setPinDraft(selected.latitude != null && selected.longitude != null
                    ? { lat: selected.latitude, lng: selected.longitude } : null);
                  setShowPin(true);
                }} className="text-red-700 underline">
                  {selected.latitude != null ? "Move pin" : "Set pin"}
                </button>
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                {selected.nature === "EMERGENCY" && (
                  <label className="flex items-center gap-2">
                    <span className="text-xs uppercase text-gray-500">Alarm level</span>
                    <select value={selected.alarmLevel ?? ""} disabled={!open || busy}
                      onChange={(e) => act(() => api.updateIncident(selected.id, { alarmLevel: e.target.value as AlarmLevel }))}
                      className="rounded border px-2 py-1">
                      {!selected.alarmLevel && <option value="">None</option>}
                      {ALARM_LEVELS.map((a) => <option key={a} value={a}>{label(a)}</option>)}
                    </select>
                  </label>
                )}
                <div className="ml-auto flex flex-wrap gap-2">
                  {!selected.underControlAt && open && (
                    <button disabled={busy} onClick={() => act(() => api.updateIncident(selected.id, { underControlAt: nowUtc() }))}
                      className="rounded border px-3 py-1.5 text-xs">Mark Under Control</button>
                  )}
                  {!selected.fireOutAt && open && (
                    <button disabled={busy} onClick={() => act(() => api.updateIncident(selected.id, { fireOutAt: nowUtc() }))}
                      className="rounded border px-3 py-1.5 text-xs">Mark Fire Out</button>
                  )}
                  {open ? (
                    <button disabled={busy} onClick={() => { setReturns({}); setShowResolve(true); }}
                      className="rounded bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">Resolve</button>
                  ) : (
                    <button disabled={busy} onClick={() => act(() => api.reopenIncident(selected.id))}
                      className="rounded border px-3 py-1.5 text-xs">Reopen</button>
                  )}
                  <button disabled={busy}
                    onClick={async () => {
                      if (!confirm(`Delete incident #${selected.id}? Anything still dispatched is released.`)) return;
                      if (await act(() => api.deleteIncident(selected.id))) setSelectedId(null);
                    }}
                    className="rounded border border-red-300 px-3 py-1.5 text-xs text-red-600">Delete</button>
                </div>
              </div>
            </div>

            <CommandPanel key={selected.id} incident={selected} open={open} busy={busy} act={act} />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Staff */}
              <div className="rounded-lg border bg-white p-5">
                <h2 className="mb-3 font-bold">Deployed Staff ({activeStaff.length})</h2>
                <ul className="mb-3 space-y-2 text-sm">
                  {activeStaff.map((s) => (
                    <li key={s.staffId} className="flex items-center justify-between rounded bg-gray-50 p-2">
                      <span>{s.name}{s.badgeNumber && <span className="text-xs text-gray-500"> · ID {s.badgeNumber}</span>}{s.role && <span className="text-xs text-gray-500"> · {s.role}</span>}</span>
                      {open && <button disabled={busy} onClick={() => act(() => api.releaseStaff(selected.id, s.staffId))}
                        className="text-xs text-red-600">Release</button>}
                    </li>
                  ))}
                  {activeStaff.length === 0 && <li className="text-gray-500">No one deployed.</li>}
                </ul>
                {open && (
                  <div className="flex gap-2">
                    <select value={staffPick} onChange={(e) => setStaffPick(e.target.value)} className={inputCls}>
                      <option value="">Assign staff...</option>
                      {availStaff.map((p) => <option key={p.id} value={p.id}>{p.name}{p.badgeNumber ? ` (${p.badgeNumber})` : ""}</option>)}
                    </select>
                    <input value={staffRole} onChange={(e) => setStaffRole(e.target.value)} placeholder="Role"
                      className="w-24 rounded border px-2 text-sm" />
                    <button disabled={busy || !staffPick}
                      onClick={async () => { if (await act(() => api.assignStaff(selected.id, Number(staffPick), staffRole.trim() || undefined))) { setStaffPick(""); setStaffRole(""); } }}
                      className="rounded bg-red-700 px-3 text-sm font-semibold text-white disabled:opacity-50">Add</button>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="rounded-lg border bg-white p-5">
                <h2 className="mb-3 font-bold">Deployed Equipment ({activeItems.length})</h2>
                <ul className="mb-3 space-y-2 text-sm">
                  {activeItems.map((i) => (
                    <li key={i.itemId} className="flex items-center justify-between gap-2 rounded bg-gray-50 p-2">
                      <span>{i.name} <span className="text-xs text-gray-500">× {i.quantity}</span></span>
                      {open && (
                        <span className="flex items-center gap-2">
                          <button disabled={busy || i.quantity <= 1} onClick={() => act(() => api.setItemQuantity(selected.id, i.itemId, i.quantity - 1))}
                            className="rounded border px-2 text-xs disabled:opacity-40">−</button>
                          <button disabled={busy} onClick={() => act(() => api.setItemQuantity(selected.id, i.itemId, i.quantity + 1))}
                            className="rounded border px-2 text-xs">+</button>
                          <button disabled={busy} onClick={() => act(() => api.releaseItem(selected.id, i.itemId))}
                            className="text-xs text-red-600">Release</button>
                        </span>
                      )}
                    </li>
                  ))}
                  {activeItems.length === 0 && <li className="text-gray-500">No equipment deployed.</li>}
                </ul>
                {open && (
                  <div className="flex gap-2">
                    <select value={itemPick} onChange={(e) => setItemPick(e.target.value)} className={inputCls}>
                      <option value="">Assign equipment...</option>
                      {availItems.filter((i) => !activeItems.some((a) => a.itemId === i.id))
                        .map((i) => <option key={i.id} value={i.id}>{i.name} ({i.quantityAvailable} free)</option>)}
                    </select>
                    <input type="number" min={1} value={itemQty} onChange={(e) => setItemQty(Number(e.target.value))}
                      className="w-16 rounded border px-2 text-sm" />
                    <button disabled={busy || !itemPick || itemQty < 1}
                      onClick={async () => { if (await act(() => api.setItemQuantity(selected.id, Number(itemPick), itemQty))) { setItemPick(""); setItemQty(1); } }}
                      className="rounded bg-red-700 px-3 text-sm font-semibold text-white disabled:opacity-50">Add</button>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-5">
              <h2 className="mb-3 font-bold">Chronological Dispatch Feed</h2>
              <ul className="space-y-3">
                {feed.map((f, i) => (
                  <li key={i} className="flex gap-4 border-t pt-3 first:border-t-0 first:pt-0">
                    <span className="w-20 shrink-0 text-xs text-gray-500">{fmtTime(f.at)}</span>
                    <div>
                      <p className="text-sm font-semibold">{f.title}</p>
                      {f.text && <p className="text-sm text-gray-600">{f.text}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-5 text-sm text-gray-500 lg:col-span-2">
            Select an incident, or report a new one.
          </div>
        )}
      </div>

      {showReport && (
        <ReportIncidentModal onClose={() => setShowReport(false)}
          onCreated={(i) => { setShowReport(false); setSelectedId(i.id); void invalidate(); }} />
      )}

      {showPin && selected && (
        <Modal title={`Map location for #${selected.id}`} onClose={() => setShowPin(false)}>
          <LocationPicker value={pinDraft} onChange={setPinDraft} initialQuery={selected.location} />
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowPin(false)} className="rounded border px-4 py-2 text-sm">Cancel</button>
            <button disabled={busy || !pinDraft}
              onClick={async () => {
                if (pinDraft && await act(() => api.updateIncident(selected.id, { latitude: pinDraft.lat, longitude: pinDraft.lng }))) {
                  setShowPin(false);
                }
              }}
              className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save Pin</button>
          </div>
        </Modal>
      )}

      {showResolve && selected && (
        <Modal title={`Resolve incident #${selected.id}`} onClose={() => setShowResolve(false)}>
          <p className="mb-3 text-sm text-gray-600">
            All staff and equipment will be released. Record the condition of any equipment that came back changed.
          </p>
          <ul className="mb-4 space-y-2 text-sm">
            {activeItems.map((i) => (
              <li key={i.itemId} className="flex items-center justify-between">
                <span>{i.name} × {i.quantity}</span>
                <select value={returns[i.itemId] ?? ""} onChange={(e) => setReturns({ ...returns, [i.itemId]: e.target.value as ItemCondition | "" })}
                  className="rounded border px-2 py-1">
                  <option value="">Unchanged</option>
                  <option value="GOOD">Good</option><option value="DAMAGED">Damaged</option><option value="RETIRED">Retired</option>
                </select>
              </li>
            ))}
            {activeItems.length === 0 && <li className="text-gray-500">No equipment deployed.</li>}
          </ul>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowResolve(false)} className="rounded border px-4 py-2 text-sm">Cancel</button>
            <button disabled={busy}
              onClick={async () => {
                const itemReturns = Object.entries(returns).filter(([, c]) => c)
                  .map(([id, condition]) => ({ itemId: Number(id), condition: condition as ItemCondition }));
                if (await act(() => api.resolveIncident(selected.id, itemReturns))) setShowResolve(false);
              }}
              className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Resolve</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
