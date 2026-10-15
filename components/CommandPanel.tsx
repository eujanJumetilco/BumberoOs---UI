"use client";
import { useState } from "react";
import { api, fmtDateTime, fmtTime, nowUtc, type Incident } from "@/lib/api";
import { inputCls } from "./Modal";

/**
 * Scene arrival, the BFP Incident Commander and the orders they gave the brigade.
 * Mount it with key={incident.id} so the drafts reset when another incident is selected.
 */
export default function CommandPanel({
  incident, open, busy, act,
}: {
  incident: Incident;
  open: boolean;
  busy: boolean;
  act: (fn: () => Promise<unknown>) => Promise<boolean>;
}) {
  const [commander, setCommander] = useState(incident.commanderName ?? "");
  const [order, setOrder] = useState("");
  const commanderChanged = commander.trim() !== (incident.commanderName ?? "");

  return (
    <div className="rounded-lg border bg-white p-5">
      <h2 className="mb-3 font-bold">Scene &amp; Command</h2>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div>
          <p className="text-xs uppercase text-gray-500">Arrived on scene</p>
          <p className="font-semibold">{incident.arrivedAt ? fmtDateTime(incident.arrivedAt) : "Not yet recorded"}</p>
        </div>
        {!incident.arrivedAt && open && (
          <button disabled={busy} onClick={() => act(() => api.updateIncident(incident.id, { arrivedAt: nowUtc() }))}
            className="rounded bg-red-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            Mark Arrived Now
          </button>
        )}
      </div>

      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-xs uppercase text-gray-500">BFP Incident Commander</span>
        <div className="flex gap-2">
          <input value={commander} onChange={(e) => setCommander(e.target.value)} disabled={!open}
            placeholder="e.g. FInsp. Ana Reyes" className={inputCls} />
          {open && (
            <button disabled={busy || !commanderChanged}
              onClick={() => act(() => api.updateIncident(incident.id, { commanderName: commander.trim() }))}
              className="rounded border px-3 text-xs font-semibold disabled:opacity-50">Save</button>
          )}
        </div>
      </label>

      <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">Commander&apos;s orders ({incident.commanderOrders.length})</h3>
      <ul className="mb-3 space-y-2 text-sm">
        {incident.commanderOrders.map((o, i) => (
          <li key={i} className="rounded bg-gray-50 p-2">
            <p>{o.instruction}</p>
            <p className="text-xs text-gray-500">{fmtTime(o.issuedAt)}</p>
          </li>
        ))}
        {incident.commanderOrders.length === 0 && <li className="text-gray-500">No orders recorded.</li>}
      </ul>
      {open && (
        <div className="flex gap-2">
          <input value={order} onChange={(e) => setOrder(e.target.value)} maxLength={1000}
            placeholder="Record an assignment or instruction..." className={inputCls} />
          <button disabled={busy || !order.trim()}
            onClick={async () => { if (await act(() => api.addCommanderOrder(incident.id, order.trim()))) setOrder(""); }}
            className="rounded bg-red-700 px-3 text-xs font-semibold text-white disabled:opacity-50">Add</button>
        </div>
      )}
    </div>
  );
}
