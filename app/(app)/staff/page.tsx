"use client";
import { useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import Modal, { Field, inputCls } from "@/components/Modal";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { api, errMsg, fmtDateTime, label, type Staff, type StaffAvailability } from "@/lib/api";
import { invalidate, useResource } from "@/lib/store";

const tones = { AVAILABLE: "green", DISPATCHED: "amber", UNAVAILABLE: "gray" } as const;
type Filter = "All" | StaffAvailability;

type Form = {
  name: string; role: string; contactNumber: string; address: string;
  employed: boolean; availability: "AVAILABLE" | "UNAVAILABLE";
  trainings: string; certifications: string; badgeNumber: string;
};
const emptyForm: Form = {
  name: "", role: "", contactNumber: "", address: "", employed: true,
  availability: "UNAVAILABLE", trainings: "", certifications: "", badgeNumber: "",
};
const toList = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export default function StaffPage() {
  const { data: staff, error: loadError, loading } = useResource("staff");
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showFile, setShowFile] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const visible = staff.filter(
    (p) =>
      (filter === "All" || p.availability === filter) &&
      (p.name + p.role + (p.badgeNumber ?? "")).toLowerCase().includes(query.toLowerCase())
  );
  const selected = staff.find((p) => p.id === selectedId) ?? staff[0];
  const count = (f: Filter) =>
    f === "All" ? staff.length : staff.filter((p) => p.availability === f).length;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await invalidate();
      return true;
    } catch (e) {
      setError(errMsg(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openAdd = () => { setEditingId(null); setForm(emptyForm); };
  const openEdit = (p: Staff) => {
    setEditingId(p.id);
    setForm({
      name: p.name, role: p.role, contactNumber: p.contactNumber ?? "", address: p.address ?? "",
      employed: p.employed,
      availability: p.availability === "AVAILABLE" ? "AVAILABLE" : "UNAVAILABLE",
      trainings: p.trainings.join(", "), certifications: p.certifications.join(", "),
      badgeNumber: p.badgeNumber ?? "",
    });
    setShowFile(false);
  };

  const save = async () => {
    if (!form) return;
    if (!form.name.trim() || !form.role.trim()) { setError("Name and role are required."); return; }
    const badge = form.badgeNumber.trim();
    if (badge && !/^\d{7}$/.test(badge)) { setError("Staff ID must be exactly 7 digits."); return; }
    const editing = editingId !== null ? staff.find((p) => p.id === editingId) : undefined;
    const body = {
      name: form.name.trim(), role: form.role.trim(),
      contactNumber: form.contactNumber.trim() || undefined,
      address: form.address.trim() || undefined,
      employed: form.employed,
      trainings: toList(form.trainings), certifications: toList(form.certifications),
      // On edit, a blank ID clears it; on create, leave it out.
      badgeNumber: editing ? badge : badge || undefined,
    };
    const ok = await run(async () => {
      if (editing) {
        // The server rejects availability changes while someone is dispatched, so only send it when it changes.
        const availability = editing.availability !== "DISPATCHED" && editing.availability !== form.availability
          ? form.availability : undefined;
        const updated = await api.updateStaff(editing.id, { ...body, availability });
        setSelectedId(updated.id);
      } else {
        const created = await api.createStaff(body);
        // New staff start UNAVAILABLE; mark on-duty ones available.
        const saved = form.availability === "AVAILABLE"
          ? await api.updateStaff(created.id, { availability: "AVAILABLE" }) : created;
        setSelectedId(saved.id);
      }
    });
    if (ok) setForm(null);
  };

  const remove = async (p: Staff) => {
    if (!confirm(`Delete ${p.name}? Staff with assignment history cannot be deleted; mark them not employed instead.`)) return;
    const ok = await run(() => api.deleteStaff(p.id));
    if (ok) { setShowFile(false); setSelectedId(null); }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "All", label: "All Personnel" },
    { key: "AVAILABLE", label: "Available" },
    { key: "DISPATCHED", label: "Dispatched" },
    { key: "UNAVAILABLE", label: "Unavailable" },
  ];

  const initials = (n: string) => n.split(" ").slice(-2).map((w) => w[0]).join("");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-sm text-gray-600">
            Manage brigade availability, certifications and contact details.
          </p>
        </div>
        <button onClick={openAdd} className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white">
          + Add Staff Member
        </button>
      </div>

      <ErrorBanner message={error ?? loadError} onDismiss={() => setError(null)} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Total Personnel">
          <p className="text-3xl font-bold">{staff.length} <span className="text-base font-normal text-gray-500">Staff</span></p>
          <p className="text-xs text-gray-500">{staff.filter((p) => p.employed).length} employed</p>
        </StatCard>
        <StatCard title="Available">
          <p className="text-3xl font-bold text-green-700">{count("AVAILABLE")} <span className="text-base font-normal">Ready</span></p>
          <p className="text-xs text-gray-500">Available to dispatch</p>
        </StatCard>
        <StatCard title="Dispatched / Active">
          <p className="text-3xl font-bold text-amber-600">{count("DISPATCHED")} <span className="text-base font-normal">Active</span></p>
          <p className="text-xs text-gray-500">Assigned to an incident</p>
        </StatCard>
        <StatCard title="Unavailable">
          <p className="text-3xl font-bold">{count("UNAVAILABLE")} <span className="text-base font-normal text-gray-500">Away</span></p>
          <p className="text-xs text-gray-500">Off duty or on leave</p>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {filters.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  filter === f.key ? "bg-red-700 text-white" : "bg-white text-gray-700"}`}>
                {f.label} ({count(f.key)})
              </button>
            ))}
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search staff..."
              className="ml-auto w-52 rounded border px-3 py-1.5 text-sm" />
          </div>

          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr><th className="py-2">Member</th><th>Staff ID</th><th>Contact</th><th>Employed</th><th>Status</th></tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} onClick={() => setSelectedId(p.id)}
                  className={`cursor-pointer border-t hover:bg-gray-50 ${p.id === selected?.id ? "bg-red-50" : ""}`}>
                  <td className="py-3">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.role}</p>
                  </td>
                  <td className="font-mono text-xs">{p.badgeNumber ?? "—"}</td>
                  <td>{p.contactNumber ?? "—"}</td>
                  <td>{p.employed ? "Yes" : "No"}</td>
                  <td><StatusBadge tone={tones[p.availability]}>{label(p.availability)}</StatusBadge></td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-500">
                  {loading ? "Loading..." : "No staff found."}
                </td></tr>
              )}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-gray-500">Showing {visible.length} of {staff.length} personnel</p>
        </div>

        {selected && (
          <div className="rounded-lg border bg-white p-5">
            <div className="mb-4 flex flex-col items-center text-center">
              <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500">
                {initials(selected.name)}
              </div>
              <p className="font-bold">{selected.name}</p>
              <p className="text-sm text-gray-500">{selected.role}</p>
              <div className="mt-2">
                <StatusBadge tone={tones[selected.availability]}>{label(selected.availability)}</StatusBadge>
              </div>
            </div>

            <div className="mb-4 flex gap-2">
              {selected.availability !== "DISPATCHED" ? (
                <button disabled={busy || !selected.employed}
                  onClick={() => run(() => api.updateStaff(selected.id, {
                    availability: selected.availability === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE" }))}
                  className="flex-1 rounded bg-red-700 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {selected.availability === "AVAILABLE" ? "Mark Unavailable" : "Mark Available"}
                </button>
              ) : (
                <p className="flex-1 rounded bg-amber-50 p-2 text-center text-xs text-amber-800">
                  On an incident. Release them from the incident to change availability.
                </p>
              )}
            </div>

            <dl className="mb-4 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Staff ID</dt><dd className="font-mono">{selected.badgeNumber ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Contact</dt><dd>{selected.contactNumber ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Address</dt><dd className="text-right">{selected.address ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Joined</dt><dd>{fmtDateTime(selected.dateJoined)}</dd></div>
            </dl>

            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">Certifications & Specialties</h3>
            <ul className="mb-4 space-y-1 text-sm">
              {selected.certifications.map((c) => <li key={c} className="rounded bg-gray-50 px-2 py-1">{c}</li>)}
              {selected.certifications.length === 0 && <li className="text-gray-500">None listed.</li>}
            </ul>

            <button onClick={() => setShowFile(true)}
              className="w-full rounded border py-2 text-sm font-semibold text-red-700">
              Open Complete Personnel File
            </button>
          </div>
        )}
      </div>

      {form && (
        <Modal title={editingId ? "Edit Staff Member" : "Add Staff Member"} onClose={() => setForm(null)}>
          <Field label="Full Name *">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Staff ID (7 digits)">
            <input value={form.badgeNumber} inputMode="numeric" maxLength={7} placeholder="e.g. 2516528"
              onChange={(e) => setForm({ ...form, badgeNumber: e.target.value.replace(/\D/g, "") })} className={inputCls} />
          </Field>
          <Field label="Role *">
            <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. volunteer, Driver Operator" className={inputCls} />
          </Field>
          <Field label="Contact Number">
            <input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Address">
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Trainings (comma separated)">
            <input value={form.trainings} onChange={(e) => setForm({ ...form, trainings: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Certifications (comma separated)">
            <input value={form.certifications} onChange={(e) => setForm({ ...form, certifications: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Availability">
            <select value={form.availability}
              disabled={editingId !== null && staff.find((p) => p.id === editingId)?.availability === "DISPATCHED"}
              onChange={(e) => setForm({ ...form, availability: e.target.value as Form["availability"] })}
              className={inputCls}>
              <option value="UNAVAILABLE">Unavailable</option>
              <option value="AVAILABLE">Available</option>
            </select>
          </Field>
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.employed} onChange={(e) => setForm({ ...form, employed: e.target.checked })} />
            Employed
          </label>
          <ErrorBanner message={error} />
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setForm(null)} className="rounded border px-4 py-2 text-sm">Cancel</button>
            <button onClick={save} disabled={busy}
              className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {editingId ? "Save Changes" : "Save Staff"}
            </button>
          </div>
        </Modal>
      )}

      {showFile && selected && (
        <Modal title="Complete Personnel File" onClose={() => setShowFile(false)}>
          <div className="mb-5 flex flex-col items-center">
            <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500">
              {initials(selected.name)}
            </div>
            <p className="font-bold">{selected.name}</p>
            <p className="text-sm text-gray-500">{selected.role}</p>
            <div className="mt-2"><StatusBadge tone={tones[selected.availability]}>{label(selected.availability)}</StatusBadge></div>
          </div>
          <div className="space-y-3 text-sm">
            {([
              ["Staff ID", selected.badgeNumber ?? "—"],
              ["Contact", selected.contactNumber ?? "—"],
              ["Address", selected.address ?? "—"],
              ["Employed", selected.employed ? "Yes" : "No"],
              ["Joined", fmtDateTime(selected.dateJoined)],
            ] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b pb-2">
                <span className="text-gray-500">{k}</span><span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
          {([["Trainings", selected.trainings], ["Certifications & Specialties", selected.certifications]] as const).map(([t, list]) => (
            <div key={t} className="mt-5">
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">{t}</h3>
              {list.length ? (
                <ul className="space-y-1">{list.map((c) => <li key={c} className="rounded bg-gray-50 px-3 py-2 text-sm">{c}</li>)}</ul>
              ) : <p className="text-sm text-gray-500">None listed.</p>}
            </div>
          ))}
          <ErrorBanner message={error} />
          <div className="mt-6 grid grid-cols-3 gap-3">
            <button onClick={() => remove(selected)} disabled={busy}
              className="rounded bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-200">Delete</button>
            <button onClick={() => openEdit(selected)}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Edit Staff</button>
            <button onClick={() => setShowFile(false)}
              className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800">Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
