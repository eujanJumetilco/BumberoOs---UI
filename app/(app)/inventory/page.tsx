"use client";
import { useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import Modal, { Field, inputCls } from "@/components/Modal";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import {
  api, errMsg, fmtDate, ITEM_CATEGORIES, label, todayManila,
  type InventoryAlert, type Item, type ItemCategory, type ItemCondition,
} from "@/lib/api";
import { useLoad } from "@/lib/useLoad";

const condTones = { GOOD: "green", DAMAGED: "amber", RETIRED: "gray" } as const;
const availTones = { AVAILABLE: "green", PARTIALLY_DISPATCHED: "amber", DISPATCHED: "red", UNAVAILABLE: "gray" } as const;
type Filter = "All" | ItemCondition;
const alertLabel: Record<InventoryAlert["type"], string> = {
  EXPIRED: "Expired", EXPIRING_SOON: "Expiring soon", MAINTENANCE_DUE: "Maintenance due",
  LOW_STOCK: "Low stock", VEHICLE_DAMAGED: "Damaged vehicle",
};

type Form = {
  name: string; description: string; serialNumber: string;
  category: ItemCategory; condition: ItemCondition; quantity: string;
  lastMaintained: string; expiryDate: string;
};
const emptyForm: Form = { name: "", description: "", serialNumber: "", category: "OTHER", condition: "GOOD", quantity: "1", lastMaintained: "", expiryDate: "" };

export default function InventoryPage() {
  const { data: items, error: loadError, loading, reload } = useLoad(() => api.listItems(), [] as Item[]);
  const { data: alerts, reload: reloadAlerts } = useLoad(() => api.listAlerts(), [] as InventoryAlert[]);
  const [error, setError] = useState<string | null>(null);
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const [category, setCategory] = useState<ItemCategory | "All">("All");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [details, setDetails] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);

  const alertsByItem = (id: number) => alerts.filter((a) => a.itemId === id);
  const categoryAlerts = alerts.filter((a) => a.itemId === null);
  const visible = items.filter(
    (i) =>
      (filter === "All" || i.condition === filter) &&
      (category === "All" || i.category === category) &&
      (!alertsOnly || alertsByItem(i.id).length > 0) &&
      (i.name + (i.serialNumber ?? "")).toLowerCase().includes(query.toLowerCase())
  );
  const count = (f: Filter) => (f === "All" ? items.length : items.filter((i) => i.condition === f).length);
  const ready = items.filter((i) => i.condition === "GOOD" && i.quantityAvailable > 0).length;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try { await fn(); await Promise.all([reload(), reloadAlerts()]); return true; }
    catch (e) { setError(errMsg(e)); return false; }
    finally { setBusy(false); }
  };

  const openEdit = (i: Item) => {
    setEditingId(i.id);
    setForm({
      name: i.name, description: i.description ?? "", serialNumber: i.serialNumber ?? "",
      category: i.category, condition: i.condition, quantity: String(i.quantity),
      lastMaintained: i.lastMaintained ?? "", expiryDate: i.expiryDate ?? "",
    });
  };

  const save = async () => {
    if (!form) return;
    const quantity = Number(form.quantity);
    if (!form.name.trim()) { setError("Equipment name is required."); return; }
    if (!Number.isInteger(quantity) || quantity < 0) { setError("Quantity must be a whole number, 0 or more."); return; }
    const body = {
      name: form.name.trim(), description: form.description.trim() || undefined,
      serialNumber: form.serialNumber.trim() || undefined,
      category: form.category, condition: form.condition, quantity,
      expiryDate: form.expiryDate || undefined,
    };
    const ok = await run(async () => {
      if (editingId) {
        await api.updateItem(editingId, { ...body, lastMaintained: form.lastMaintained || undefined });
      } else {
        const created = await api.createItem(body);
        // The create call has no maintenance date, so record it right after.
        if (form.lastMaintained) await api.updateItem(created.id, { lastMaintained: form.lastMaintained });
      }
    });
    if (ok) setForm(null);
  };

  const remove = async (i: Item) => {
    if (!confirm(`Delete "${i.name}"? Items that have been dispatched before cannot be deleted; retire them instead.`)) return;
    await run(() => api.deleteItem(i.id));
  };

  const exportCsv = () => {
    const rows = [["Name", "Category", "Serial", "Condition", "Quantity", "Dispatched", "Available", "Last maintained", "Expiry"],
      ...visible.map((i) => [i.name, i.category, i.serialNumber ?? "", i.condition, i.quantity, i.quantityDispatched, i.quantityAvailable, i.lastMaintained ?? "", i.expiryDate ?? ""])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "inventory.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "All", label: "All Equipment" },
    { key: "GOOD", label: "Good Condition" },
    { key: "DAMAGED", label: "Damaged" },
    { key: "RETIRED", label: "Retired" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Apparatus & Tactical Equipment Inventory</h1>
          <p className="text-sm text-gray-600">Stock levels, condition and live dispatch status for brigade assets.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="rounded border bg-white px-4 py-2 text-sm">Export CSV</button>
          <button onClick={() => { setEditingId(null); setForm(emptyForm); }}
            className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white">
            + Add Equipment / Asset
          </button>
        </div>
      </div>

      <ErrorBanner message={error ?? loadError} onDismiss={() => setError(null)} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Total Tracked Assets">
          <p className="text-3xl font-bold">{items.length} <span className="text-base font-normal text-gray-500">Items</span></p>
          <p className="text-xs text-gray-500">{items.reduce((n, i) => n + i.quantity, 0)} units in stock</p>
        </StatCard>
        <StatCard title="Ready to Dispatch">
          <p className="text-3xl font-bold text-green-700">{ready} <span className="text-base font-normal">Ready</span></p>
          <p className="text-xs text-gray-500">Good condition with free units</p>
        </StatCard>
        <StatCard title="Dispatched">
          <p className="text-3xl font-bold text-amber-600">
            {items.reduce((n, i) => n + i.quantityDispatched, 0)} <span className="text-base font-normal">Units</span>
          </p>
          <p className="text-xs text-gray-500">Currently out on incidents</p>
        </StatCard>
        <StatCard title="Damaged / Retired">
          <p className="text-3xl font-bold">{count("DAMAGED") + count("RETIRED")} <span className="text-base font-normal text-gray-500">Out of Service</span></p>
          <p className="text-xs text-gray-500">{count("DAMAGED")} damaged · {count("RETIRED")} retired</p>
        </StatCard>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="mb-2 text-sm font-bold text-amber-800">Needs attention ({alerts.length})</h2>
          <ul className="space-y-1 text-sm">
            {alerts.map((a, n) => (
              <li key={n} className="flex items-start gap-2">
                <StatusBadge tone={a.severity === "HIGH" ? "red" : "amber"}>{alertLabel[a.type]}</StatusBadge>
                <span>{a.message}</span>
              </li>
            ))}
          </ul>
          {categoryAlerts.length > 0 && <p className="mt-2 text-xs text-gray-500">Low-stock thresholds are set in Settings → Inventory Rules.</p>}
        </div>
      )}

      <div className="rounded-lg border bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3 py-1 text-sm ${filter === f.key ? "bg-red-700 text-white" : "bg-white text-gray-700"}`}>
              {f.label} ({count(f.key)})
            </button>
          ))}
          <button onClick={() => setAlertsOnly(!alertsOnly)}
            className={`rounded-full border px-3 py-1 text-sm ${alertsOnly ? "bg-amber-600 text-white" : "bg-white text-gray-700"}`}>
            Needs attention ({items.filter((i) => alertsByItem(i.id).length > 0).length})
          </button>
          <select value={category} onChange={(e) => setCategory(e.target.value as ItemCategory | "All")}
            className="ml-auto rounded border px-2 py-1.5 text-sm">
            <option value="All">All categories</option>
            {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}
          </select>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search equipment..."
            className="w-56 rounded border px-3 py-1.5 text-sm" />
        </div>

        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-gray-500">
            <tr>
              <th className="py-2">Equipment / Item</th><th>Category</th><th>Serial</th>
              <th>Condition</th><th>Stock</th><th>Maintained / Expires</th><th>Availability</th><th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="py-3 font-medium">
                  {i.name}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {alertsByItem(i.id).map((a, n) => (
                      <span key={n} title={a.message}><StatusBadge tone={a.severity === "HIGH" ? "red" : "amber"}>{alertLabel[a.type]}</StatusBadge></span>
                    ))}
                  </div>
                </td>
                <td>{label(i.category)}</td>
                <td>{i.serialNumber ?? "—"}</td>
                <td><StatusBadge tone={condTones[i.condition]}>{label(i.condition)}</StatusBadge></td>
                <td>{i.quantityAvailable} / {i.quantity} free</td>
                <td className="text-xs">
                  <p>Maintained: {i.lastMaintained ? fmtDate(i.lastMaintained) : "—"}</p>
                  {i.expiryDate && <p>Expires: {fmtDate(i.expiryDate)}</p>}
                </td>
                <td><StatusBadge tone={availTones[i.availability]}>{label(i.availability)}</StatusBadge></td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(i)} className="rounded border px-3 py-1 text-xs">Edit</button>
                    {i.condition !== "RETIRED" && (
                      <button disabled={busy} onClick={() => run(() => api.updateItem(i.id, { lastMaintained: todayManila() }))}
                        className="rounded border px-3 py-1 text-xs">Maintained today</button>
                    )}
                    {i.condition !== "RETIRED" && (
                      <button disabled={busy}
                        onClick={() => confirm(`Retire "${i.name}"?`) && run(() => api.updateItem(i.id, { condition: "RETIRED" }))}
                        className="rounded border border-red-300 px-3 py-1 text-xs text-red-600">Retire</button>
                    )}
                    <button onClick={() => setDetails(i)} className="rounded border px-3 py-1 text-xs">View Details</button>
                    <button disabled={busy} onClick={() => remove(i)} className="rounded border px-3 py-1 text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={8} className="py-6 text-center text-gray-500">{loading ? "Loading..." : "No equipment found."}</td></tr>
            )}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-500">Showing {visible.length} of {items.length} tracked assets</p>
      </div>

      {form && (
        <Modal title={editingId ? "Edit Equipment / Asset" : "Add Equipment / Asset"} onClose={() => setForm(null)}>
          <Field label="Equipment Name *">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Fire Suit" className={inputCls} />
          </Field>
          <Field label="Description">
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Serial Number">
            <input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              placeholder="e.g. ABC 123" className={inputCls} />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ItemCategory })} className={inputCls}>
              {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{label(c)}</option>)}
            </select>
          </Field>
          <Field label="Condition">
            <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value as ItemCondition })} className={inputCls}>
              <option value="GOOD">Good</option><option value="DAMAGED">Damaged</option><option value="RETIRED">Retired</option>
            </select>
          </Field>
          <Field label="Quantity (e.g. 10 suits is one row; an engine is 1)">
            <input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Last maintained">
            <input type="date" max={todayManila()} value={form.lastMaintained}
              onChange={(e) => setForm({ ...form, lastMaintained: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Expiry date (for items that expire; cannot be cleared once set)">
            <input type="date" value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className={inputCls} />
          </Field>
          <ErrorBanner message={error} />
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setForm(null)} className="rounded border px-4 py-2 text-sm">Cancel</button>
            <button onClick={save} disabled={busy}
              className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {editingId ? "Save Changes" : "Add Equipment"}
            </button>
          </div>
        </Modal>
      )}

      {details && (
        <Modal title="Equipment Details" onClose={() => setDetails(null)}>
          <div className="space-y-4">
            {([
              ["Equipment Name", details.name], ["Description", details.description ?? "—"],
              ["Serial", details.serialNumber ?? "—"], ["Category", label(details.category)],
              ["Condition", label(details.condition)], ["Availability", label(details.availability)],
              ["Quantity", `${details.quantity} total · ${details.quantityDispatched} dispatched · ${details.quantityAvailable} available`],
              ["Last Maintained", details.lastMaintained ? fmtDate(details.lastMaintained) : "—"],
              ["Expiry Date", details.expiryDate ? fmtDate(details.expiryDate) : "—"],
            ] as const).map(([k, v]) => (
              <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium">{v}</p></div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={() => setDetails(null)} className="rounded border px-4 py-2 text-sm">Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
