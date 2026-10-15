"use client";
import { useEffect, useState } from "react";
import ErrorBanner from "./ErrorBanner";
import Modal, { Field, inputCls } from "./Modal";
import { useAccount } from "@/lib/auth";
import {
  ALARM_LEVELS, api, errMsg, label, type AlarmLevel, type Incident, type IncidentNature, type Item, type Staff,
} from "@/lib/api";

const TYPES = ["Fire", "Structure Fire", "Vehicle Fire", "Medical Emergency", "Hazmat", "Rescue", "Standby", "Drill"];

export default function ReportIncidentModal({
  onClose, onCreated,
}: { onClose: () => void; onCreated: (i: Incident) => void }) {
  const account = useAccount();
  const [nature, setNature] = useState<IncidentNature>("EMERGENCY");
  const [alarmLevel, setAlarmLevel] = useState<AlarmLevel | "">("FIRST_ALARM");
  const [incidentType, setIncidentType] = useState("");
  const [location, setLocation] = useState("");
  const [reportedBy, setReportedBy] = useState(account?.displayName ?? account?.email ?? "");
  const [staff, setStaff] = useState<Staff[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [staffIds, setStaffIds] = useState<number[]>([]);
  const [qty, setQty] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listStaff("AVAILABLE").then((s) => setStaff(s.filter((p) => p.employed))).catch((e) => setError(errMsg(e)));
    api.listItems({ availableOnly: true }).then(setItems).catch((e) => setError(errMsg(e)));
  }, []);

  const submit = async () => {
    if (!incidentType.trim() || !location.trim() || !reportedBy.trim()) {
      setError("Incident type, location and reporter are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await api.createIncident({
        nature,
        alarmLevel: nature === "EMERGENCY" && alarmLevel ? alarmLevel : undefined,
        incidentType: incidentType.trim(), location: location.trim(), reportedBy: reportedBy.trim(),
        staffIds: staffIds.length ? staffIds : undefined,
        items: Object.entries(qty).filter(([, q]) => q > 0).map(([id, q]) => ({ itemId: Number(id), quantity: q })),
      });
      onCreated(created);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Report New Incident" onClose={onClose}>
      <Field label="Nature">
        <select value={nature} onChange={(e) => setNature(e.target.value as IncidentNature)} className={inputCls}>
          <option value="EMERGENCY">Emergency</option>
          <option value="NON_EMERGENCY">Non-emergency (standby, drill...)</option>
        </select>
      </Field>
      {nature === "EMERGENCY" && (
        <Field label="Alarm level (declared by the BFP)">
          <select value={alarmLevel} onChange={(e) => setAlarmLevel(e.target.value as AlarmLevel | "")} className={inputCls}>
            <option value="">None yet</option>
            {ALARM_LEVELS.map((a) => <option key={a} value={a}>{label(a)}</option>)}
          </select>
        </Field>
      )}
      <Field label="Incident Type *">
        <input list="incident-types" value={incidentType} onChange={(e) => setIncidentType(e.target.value)} className={inputCls} />
        <datalist id="incident-types">{TYPES.map((t) => <option key={t} value={t} />)}</datalist>
      </Field>
      <Field label="Location *">
        <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Reported By *">
        <input value={reportedBy} onChange={(e) => setReportedBy(e.target.value)} className={inputCls} />
      </Field>

      <p className="mb-1 text-sm font-semibold">Dispatch staff now (optional)</p>
      <div className="mb-4 max-h-28 overflow-y-auto rounded border p-2 text-sm">
        {staff.length === 0 && <p className="text-gray-500">No available staff.</p>}
        {staff.map((p) => (
          <label key={p.id} className="flex items-center gap-2 py-0.5">
            <input type="checkbox" checked={staffIds.includes(p.id)}
              onChange={(e) => setStaffIds(e.target.checked ? [...staffIds, p.id] : staffIds.filter((x) => x !== p.id))} />
            {p.name} <span className="text-xs text-gray-500">{p.role}{p.badgeNumber ? ` · ID ${p.badgeNumber}` : ""}</span>
          </label>
        ))}
      </div>

      <p className="mb-1 text-sm font-semibold">Dispatch equipment now (optional)</p>
      <div className="mb-4 max-h-28 overflow-y-auto rounded border p-2 text-sm">
        {items.length === 0 && <p className="text-gray-500">No available equipment.</p>}
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between py-0.5">
            <span>{i.name} <span className="text-xs text-gray-500">({i.quantityAvailable} free)</span></span>
            <input type="number" min={0} max={i.quantityAvailable} value={qty[i.id] ?? 0}
              onChange={(e) => setQty({ ...qty, [i.id]: Number(e.target.value) })}
              className="w-16 rounded border px-2 py-0.5" />
          </div>
        ))}
      </div>

      <ErrorBanner message={error} />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded border px-4 py-2 text-sm">Cancel</button>
        <button onClick={submit} disabled={busy}
          className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Saving..." : "Save Incident"}
        </button>
      </div>
    </Modal>
  );
}
