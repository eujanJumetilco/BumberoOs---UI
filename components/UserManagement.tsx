"use client";
import { useState } from "react";
import ErrorBanner from "./ErrorBanner";
import Modal, { Field, inputCls } from "./Modal";
import StatusBadge from "./StatusBadge";
import { api, errMsg, fmtDateTime, label, type UserRole } from "@/lib/api";
import { useAccount } from "@/lib/auth";
import { invalidate, useResource } from "@/lib/store";

type Form = { email: string; password: string; displayName: string; role: UserRole };
const emptyForm: Form = { email: "", password: "", displayName: "", role: "DISPATCHER" };

/** Admin-only account management. The server enforces the same rules; this is the interface to them. */
export default function UserManagement() {
  const me = useAccount();
  const { data: accounts, error: loadError, loading } = useResource("accounts");
  const { data: staff } = useResource("staff");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<Form | null>(null);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try { await fn(); await invalidate(); return true; }
    catch (e) { setError(errMsg(e)); return false; }
    finally { setBusy(false); }
  };

  const create = async () => {
    if (!form) return;
    if (!form.email.trim() || form.password.length < 8) {
      setError("Enter an email and a password of at least 8 characters.");
      return;
    }
    const ok = await run(() => api.createAccount({
      email: form.email.trim(), password: form.password,
      displayName: form.displayName.trim() || undefined, role: form.role,
    }));
    if (ok) setForm(null);
  };

  const staffName = (id: number | null) => staff.find((s) => s.id === id)?.name;
  const takenBy = (staffId: number, accountId: number) =>
    accounts.some((a) => a.staffId === staffId && a.id !== accountId);
  const admins = accounts.filter((a) => a.role === "ADMIN" && a.enabled).length;

  return (
    <div className="rounded-lg border bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold">User accounts</h2>
          <p className="text-sm text-gray-500">
            Admins manage accounts and settings. Dispatchers run incidents, staff and inventory.
            {" "}{admins} enabled admin{admins === 1 ? "" : "s"}.
          </p>
        </div>
        <button onClick={() => { setError(null); setForm(emptyForm); }}
          className="shrink-0 rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white">+ Add account</button>
      </div>

      <ErrorBanner message={error ?? loadError} onDismiss={() => setError(null)} />

      <div className="overflow-x-auto">
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-xs uppercase text-gray-500">
            <tr><th className="py-2">Account</th><th>Role</th><th>Status</th><th>Linked staff</th><th /></tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
              const self = a.id === me?.id;
              return (
                <tr key={a.id} className="border-t align-middle">
                  <td className="py-3">
                    <p className="font-medium">{a.displayName ?? a.email}{self && <span className="ml-2 text-xs text-gray-500">(you)</span>}</p>
                    <p className="text-xs text-gray-500">{a.displayName ? `${a.email} · ` : ""}added {fmtDateTime(a.createdAt)}</p>
                  </td>
                  <td>
                    <select value={a.role} disabled={busy || self} title={self ? "You cannot change your own role" : undefined}
                      onChange={(e) => run(() => api.setAccountRole(a.id, e.target.value as UserRole))}
                      className="rounded border px-2 py-1">
                      <option value="ADMIN">Admin</option>
                      <option value="DISPATCHER">Dispatcher</option>
                    </select>
                  </td>
                  <td>
                    <StatusBadge tone={a.enabled ? "green" : "gray"}>{a.enabled ? "Enabled" : "Disabled"}</StatusBadge>
                  </td>
                  <td>
                    <select value={a.staffId ?? ""} disabled={busy}
                      onChange={(e) => run(() => e.target.value
                        ? api.linkAccountStaff(a.id, Number(e.target.value)) : api.unlinkAccountStaff(a.id))}
                      className="max-w-40 rounded border px-2 py-1">
                      <option value="">None</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id} disabled={takenBy(s.id, a.id)}>
                          {s.name}{takenBy(s.id, a.id) ? " (has an account)" : ""}
                        </option>
                      ))}
                    </select>
                    {a.staffId && !staffName(a.staffId) && <span className="ml-1 text-xs text-gray-500">#{a.staffId}</span>}
                  </td>
                  <td className="space-x-2 text-right">
                    <button disabled={busy || self} title={self ? "You cannot disable your own account" : undefined}
                      onClick={() => {
                        if (a.enabled && !confirm(`Disable ${a.email}? They are signed out immediately.`)) return;
                        void run(() => api.setAccountEnabled(a.id, !a.enabled));
                      }}
                      className="rounded border px-3 py-1 text-xs disabled:opacity-50">
                      {a.enabled ? "Disable" : "Enable"}
                    </button>
                    <button disabled={busy || self}
                      onClick={() => confirm(`Delete ${a.email}? This cannot be undone.`) && run(() => api.deleteAccount(a.id))}
                      className="rounded border border-red-300 px-3 py-1 text-xs text-red-600 disabled:opacity-50">Delete</button>
                  </td>
                </tr>
              );
            })}
            {accounts.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-gray-500">{loading ? "Loading..." : "No accounts."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal title="Add account" onClose={() => setForm(null)}>
          <Field label="Email *">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Display name">
            <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Temporary password * (at least 8 characters)">
            <input type="password" value={form.password} autoComplete="new-password"
              onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Role">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className={inputCls}>
              <option value="DISPATCHER">{label("DISPATCHER")}</option>
              <option value="ADMIN">{label("ADMIN")}</option>
            </select>
          </Field>
          <ErrorBanner message={error} />
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setForm(null)} className="rounded border px-4 py-2 text-sm">Cancel</button>
            <button onClick={create} disabled={busy}
              className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Create account</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
