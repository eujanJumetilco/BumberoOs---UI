"use client";
import { useEffect, useState } from "react";
import ErrorBanner from "./ErrorBanner";
import {
  api, errMsg, ITEM_CATEGORIES, label, type CategoryRule, type InventoryRules, type ItemCategory,
} from "@/lib/api";

const num = (v: string) => (v === "" ? null : Math.max(0, Math.floor(Number(v))));

/** Station-wide inventory rules. Everyone can read them; only admins can save changes. */
export default function InventoryRulesPanel({ canEdit }: { canEdit: boolean }) {
  const [rules, setRules] = useState<InventoryRules | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getInventoryRules().then(setRules).catch((e) => setError(errMsg(e)));
  }, []);

  if (!rules) return <div className="rounded-lg border bg-white p-5 text-sm text-gray-500">{error ?? "Loading..."}</div>;

  const edit = (patch: Partial<InventoryRules>) => { setSaved(false); setRules({ ...rules, ...patch }); };
  const editCategory = (category: ItemCategory, patch: Partial<CategoryRule>) =>
    edit({ categories: rules.categories.map((c) => (c.category === category ? { ...c, ...patch } : c)) });

  const save = async () => {
    setBusy(true);
    setError(null);
    try { setRules(await api.saveInventoryRules(rules)); setSaved(true); }
    catch (e) { setError(errMsg(e)); }
    finally { setBusy(false); }
  };

  const field = "w-24 rounded border px-2 py-1 text-sm disabled:bg-gray-50";

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-5">
        <h2 className="font-bold">Station-wide</h2>
        <p className="mb-3 text-sm text-gray-500">
          These rules are shared by everyone using the system.
          {!canEdit && " Only an administrator can change them."}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t py-3">
          <div className="max-w-md">
            <p className="text-sm font-semibold">Maintenance reminder interval (days)</p>
            <p className="text-xs text-gray-500">
              Flag equipment whose last maintenance is older than this, or that has no maintenance record.
              0 turns reminders off unless a category sets its own.
            </p>
          </div>
          <input type="number" min={0} disabled={!canEdit} className={field} value={rules.defaultMaintenanceIntervalDays}
            onChange={(e) => edit({ defaultMaintenanceIntervalDays: num(e.target.value) ?? 0 })} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t py-3">
          <div className="max-w-md">
            <p className="text-sm font-semibold">Expiry warning window (days)</p>
            <p className="text-xs text-gray-500">Flag items with an expiry date this many days ahead, such as fire extinguishers.</p>
          </div>
          <input type="number" min={0} disabled={!canEdit} className={field} value={rules.expiryWarningDays}
            onChange={(e) => edit({ expiryWarningDays: num(e.target.value) ?? 0 })} />
        </div>
      </div>

      <div className="rounded-lg border bg-white p-5">
        <h2 className="font-bold">By category</h2>
        <p className="mb-3 text-sm text-gray-500">
          Low stock counts usable units: good condition and not out on an incident. Leave the interval empty to use the
          station-wide one, or enter 0 for no reminders in that category.
        </p>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-gray-500">
            <tr><th className="py-2">Category</th><th>Low-stock threshold</th><th>Maintenance interval (days)</th></tr>
          </thead>
          <tbody>
            {ITEM_CATEGORIES.map((category) => {
              const rule = rules.categories.find((c) => c.category === category)
                ?? { category, lowStockThreshold: 0, maintenanceIntervalDays: null };
              return (
                <tr key={category} className="border-t">
                  <td className="py-2">{label(category)}</td>
                  <td>
                    <input type="number" min={0} disabled={!canEdit} className={field} value={rule.lowStockThreshold}
                      onChange={(e) => editCategory(category, { lowStockThreshold: num(e.target.value) ?? 0 })} />
                  </td>
                  <td>
                    <input type="number" min={0} disabled={!canEdit} className={field} placeholder="default"
                      value={rule.maintenanceIntervalDays ?? ""}
                      onChange={(e) => editCategory(category, { maintenanceIntervalDays: num(e.target.value) })} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError(null)} />
      {canEdit && (
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-green-700">Saved.</span>}
          <button onClick={save} disabled={busy}
            className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save rules</button>
        </div>
      )}
    </div>
  );
}
