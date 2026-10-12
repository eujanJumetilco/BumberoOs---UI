"use client";
import { useState } from "react";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";

type Status = "Available" | "Dispatched" | "Off-Duty";

type Person = {
  id: string;
  name: string;
  role: string;
  rank: string;
  shift: string;
  unit: string;
  tac: string;
  status: Status;
  certs: string[];
};

const initialStaff: Person[] = [
  { id: "1", name: "Capt. Marco Silva", role: "Station Captain", rank: "Captain", shift: "Shift A", unit: "Station Command", tac: "TAC-1", status: "Available", certs: ["Incident Command 300", "Hazmat Technician", "EMT-B"] },
  { id: "2", name: "Lt. Elena Santos", role: "Paramedic Lead", rank: "Lieutenant", shift: "Shift B", unit: "Rescue 2", tac: "REC-ST", status: "Dispatched", certs: ["Paramedic", "ACLS"] },
  { id: "3", name: "Sgt. David Mills", role: "Driver Operator", rank: "Sergeant", shift: "Shift A", unit: "Ladder 1", tac: "TAC-3", status: "Available", certs: ["Pump Operator", "Aerial Operator"] },
  { id: "4", name: "Firefighter Marco Reyes", role: "Firefighter / Rescue", rank: "Firefighter", shift: "Shift B", unit: "Engine 1", tac: "TAC-4", status: "Dispatched", certs: ["Firefighter II", "EMT-B"] },
  { id: "5", name: "Firefighter Sarah Jenkins", role: "Firefighter", rank: "Firefighter", shift: "Shift C", unit: "Engine 4", tac: "STBY-01", status: "Off-Duty", certs: ["Firefighter I"] },
];

const tones = { Available: "green", Dispatched: "amber", "Off-Duty": "gray" } as const;
type Filter = "All" | Status;

export default function StaffPage() {
  const [staff, setStaff] = useState(initialStaff);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialStaff[0].id);

  const [showAddStaff, setShowAddStaff] = useState(false);
const [showPersonnelFile, setShowPersonnelFile] = useState(false);
const [showEditStaff, setShowEditStaff] = useState(false);
const [editStaff, setEditStaff] = useState({
  name: "",
  role: "",
  rank: "",
  shift: "Shift A",
  unit: "",
  tac: "",
});
  const [newStaff, setNewStaff] = useState({
  name: "",
  role: "",
  rank: "",
  shift: "Shift A",
  unit: "",
  tac: "",
});
  const visible = staff.filter(
    (p) =>
      (filter === "All" || p.status === filter) &&
      (p.name + p.unit + p.role).toLowerCase().includes(query.toLowerCase())
  );

  const selected = staff.find((p) => p.id === selectedId) ?? staff[0];
  const count = (f: Filter) =>
    f === "All" ? staff.length : staff.filter((p) => p.status === f).length;

  const assignUnit = () => {
    setStaff(
      staff.map((p) =>
        p.id === selected.id ? { ...p, status: "Dispatched", unit: "Engine 4" } : p
      )
    );
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "All", label: "All Personnel" },
    { key: "Available", label: "Available" },
    { key: "Dispatched", label: "Dispatched" },
    { key: "Off-Duty", label: "Off-Duty" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-sm text-gray-600">
            Manage brigade assignments, statuses, certifications and emergency contacts.
          </p>
        </div>
        <div className="flex gap-2">
          <button
  onClick={() => alert("Staff roster exported successfully!")}
  className="rounded border bg-white px-4 py-2 text-sm"
>
  Export Roster</button>
          <button  onClick={() => setShowAddStaff(true)}
  className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white"
>
            + Add Staff Member
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Total Personnel">
          <p className="text-3xl font-bold">{staff.length * 0 + 24} <span className="text-base font-normal text-gray-500">Staff</span></p>
          <p className="text-xs text-gray-500">100% certified</p>
        </StatCard>
        <StatCard title="On-Duty Available">
          <p className="text-3xl font-bold text-green-700">18 <span className="text-base font-normal">Ready</span></p>
          <p className="text-xs text-gray-500">Available to dispatch</p>
        </StatCard>
        <StatCard title="Dispatched / Active">
          <p className="text-3xl font-bold text-amber-600">4 <span className="text-base font-normal">Active</span></p>
          <p className="text-xs text-gray-500">Engine 4, Medic 2</p>
        </StatCard>
        <StatCard title="Off-Duty / Leave">
          <p className="text-3xl font-bold">2 <span className="text-base font-normal text-gray-500">Away</span></p>
          <p className="text-xs text-gray-500">Scheduled leave</p>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Table */}
        <div className="rounded-lg border bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  filter === f.key ? "bg-red-700 text-white" : "bg-white text-gray-700"
                }`}
              >
                {f.label} ({count(f.key)})
              </button>
            ))}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search staff..."
              className="ml-auto w-52 rounded border px-3 py-1.5 text-sm"
            />
          </div>

          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2">Firefighter</th>
                <th>Rank</th>
                <th>Shift & Unit</th>
                <th>Comms</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`cursor-pointer border-t hover:bg-gray-50 ${
                    p.id === selected.id ? "bg-red-50" : ""
                  }`}
                >
                  <td className="py-3">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.role}</p>
                  </td>
                  <td>{p.rank}</td>
                  <td>{p.shift} · {p.unit}</td>
                  <td>{p.tac}</td>
                  <td><StatusBadge tone={tones[p.status]}>{p.status}</StatusBadge></td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-500">No staff found.</td></tr>
              )}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-gray-500">
            Showing {visible.length} of {staff.length} loaded personnel
          </p>
        </div>

        {/* Detail panel */}
        <div className="rounded-lg border bg-white p-5">
          <div className="mb-4 flex flex-col items-center text-center">
            <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500">
              {selected.name.split(" ").slice(-2).map((w) => w[0]).join("")}
            </div>
            <p className="font-bold">{selected.name}</p>
            <p className="text-sm text-gray-500">{selected.role}</p>
            <div className="mt-2">
              <StatusBadge tone={tones[selected.status]}>{selected.status}</StatusBadge>
            </div>
          </div>

          <div className="mb-4 flex gap-2">
            <button   onClick={() => {
    alert(`Dialing ${selected.tac} for ${selected.name}...`);
  }}
  className="flex-1 rounded border py-2 text-sm font-semibold"
>
  Dial {selected.tac}
            </button>
            <button
              onClick={assignUnit}
              className="flex-1 rounded bg-red-700 py-2 text-sm font-semibold text-white"
            >
              Assign Unit
            </button>
          </div>

          <dl className="mb-4 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Rank</dt><dd>{selected.rank}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Shift</dt><dd>{selected.shift}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Assigned Unit</dt><dd>{selected.unit}</dd></div>
          </dl>

          <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
            Certifications & Specialties
          </h3>
          <ul className="mb-4 space-y-1 text-sm">
            {selected.certs.map((c) => (
              <li key={c} className="rounded bg-gray-50 px-2 py-1">{c}</li>
            ))}
          </ul>

          <button onClick={() => setShowPersonnelFile(true)}
  className="w-full rounded border py-2 text-sm font-semibold text-red-700"
>
  Open Complete Personnel File
          </button>
        </div>
      </div>
    {showAddStaff && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-1 text-xl font-bold">
        Add Staff Member
      </h2>

      <p className="mb-5 text-sm text-gray-500">
        Enter the staff member's information.
      </p>

      <div className="space-y-4">

        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Full Name
          </label>

          <input
            type="text"
            value={newStaff.name}
            onChange={(e) =>
              setNewStaff({
                ...newStaff,
                name: e.target.value,
              })
            }
            placeholder="e.g. Firefighter John Smith"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        {/* Role */}
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Role
          </label>

          <select
            value={newStaff.role}
            onChange={(e) =>
              setNewStaff({
                ...newStaff,
      role: e.target.value,
    })
  }
  className="w-full rounded border px-3 py-2"
>
  <option value="">Select role</option>
  <option value="Station Captain">Station Captain</option>
  <option value="Paramedic Lead">Paramedic Lead</option>
  <option value="Driver Operator">Driver Operator</option>
  <option value="Firefighter / Rescue">Firefighter / Rescue</option>
  <option value="Firefighter">Firefighter</option>
  <option value="Dispatcher">Dispatcher</option>
  <option value="Safety Officer">Safety Officer</option>
  <option value="Logistics Officer">Logistics Officer</option>
  <option value="Training Officer">Training Officer</option>
  <option value="Administrative Officer">Administrative Officer</option>
</select>
        </div>

        {/* Rank */}
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Rank
          </label>

          <select
            value={newStaff.rank}
            onChange={(e) =>
              setNewStaff({
                ...newStaff,
                rank: e.target.value,
              })
            }
            className="w-full rounded border px-3 py-2"
          >
            <option value="">Select rank</option>
            <option value="Firefighter">Firefighter</option>
            <option value="Sergeant">Sergeant</option>
            <option value="Lieutenant">Lieutenant</option>
            <option value="Captain">Captain</option>
          </select>
        </div>

        {/* Shift */}
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Shift
          </label>

          <select
            value={newStaff.shift}
            onChange={(e) =>
              setNewStaff({
                ...newStaff,
                shift: e.target.value,
              })
            }
            className="w-full rounded border px-3 py-2"
          >
            <option value="Shift A">Shift A</option>
            <option value="Shift B">Shift B</option>
            <option value="Shift C">Shift C</option>
          </select>
        </div>

        {/* Unit */}
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Assigned Unit
          </label>

          <input
            type="text"
            value={newStaff.unit}
            onChange={(e) =>
              setNewStaff({
                ...newStaff,
                unit: e.target.value,
              })
            }
            placeholder="e.g. Engine 4"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        {/* TAC */}
        <div>
          <label className="mb-1 block text-sm font-semibold">
            TAC / Comms
          </label>

          <input
            type="text"
            value={newStaff.tac}
            onChange={(e) =>
              setNewStaff({
                ...newStaff,
                tac: e.target.value,
              })
            }
            placeholder="e.g. TAC-5"
            className="w-full rounded border px-3 py-2"
          />
        </div>

      </div>

      {/* Buttons */}
      <div className="mt-6 flex justify-end gap-2">

        <button
          onClick={() => setShowAddStaff(false)}
          className="rounded border px-4 py-2"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            if (
              !newStaff.name ||
              !newStaff.role ||
              !newStaff.rank ||
              !newStaff.unit ||
              !newStaff.tac
            ) {
              alert("Please complete all required fields.");
              return;
            }

            const person: Person = {
              id: Date.now().toString(),
              name: newStaff.name,
              role: newStaff.role,
              rank: newStaff.rank,
              shift: newStaff.shift,
              unit: newStaff.unit,
              tac: newStaff.tac,
              status: "Available",
              certs: [],
            };

            setStaff([...staff, person]);

            setNewStaff({
              name: "",
              role: "",
              rank: "",
              shift: "Shift A",
              unit: "",
              tac: "",
            });

            setShowAddStaff(false);

            alert("Staff member added successfully.");
          }}
          className="rounded bg-red-700 px-4 py-2 font-semibold text-white"
        >
          Save Staff
        </button>

      </div>
    </div>
  </div>
      )}
      {showPersonnelFile && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">

      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">
            Complete Personnel File
          </h2>

          <p className="text-sm text-gray-500">
            Staff information
          </p>
        </div>

        <button
          onClick={() => setShowPersonnelFile(false)}
          className="text-xl text-gray-500 hover:text-gray-900"
        >
          ×
        </button>
      </div>

      {/* Profile */}
      <div className="mb-5 flex flex-col items-center">
        <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500">
          {selected.name
            .split(" ")
            .slice(-2)
            .map((w) => w[0])
            .join("")}
        </div>

        <p className="font-bold">
          {selected.name}
        </p>

        <p className="text-sm text-gray-500">
          {selected.role}
        </p>

        <div className="mt-2">
          <StatusBadge tone={tones[selected.status]}>
            {selected.status}
          </StatusBadge>
        </div>
      </div>

      {/* Staff Information */}
      <div className="space-y-3 text-sm">

        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500">
            Rank
          </span>

          <span className="font-semibold">
            {selected.rank}
          </span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500">
            Shift
          </span>

          <span className="font-semibold">
            {selected.shift}
          </span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500">
            Assigned Unit
          </span>

          <span className="font-semibold">
            {selected.unit}
          </span>
        </div>

        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500">
            TAC / Comms
          </span>

          <span className="font-semibold">
            {selected.tac}
          </span>
        </div>

      </div>

      {/* Certifications */}
      <div className="mt-5">
        <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
          Certifications & Specialties
        </h3>

        {selected.certs.length > 0 ? (
          <ul className="space-y-1">
            {selected.certs.map((cert) => (
              <li
                key={cert}
                className="rounded bg-gray-50 px-3 py-2 text-sm"
              >
                {cert}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            No certifications listed.
          </p>
        )}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
         onClick={() => {
      const confirmed = confirm(
        `Are you sure you want to delete ${selected.name}?`
      );

      if (confirmed) {
        setStaff(staff.filter((p) => p.id !== selected.id));
        setShowPersonnelFile(false);
      }
    }}
    className="w-full rounded bg-red-100 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
  >
    Delete
  </button>

  <button
       onClick={() => {
  setEditStaff({
    name: selected.name,
    role: selected.role,
    rank: selected.rank,
    shift: selected.shift,
    unit: selected.unit,
    tac: selected.tac,
  });

            setShowPersonnelFile(false);
            setShowEditStaff(true);
          }}
          className="w-full rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Edit Staff
        </button>

        <button
          onClick={() => setShowPersonnelFile(false)}
          className="w-full rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}
   {showEditStaff && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">

      <div className="mb-5">
        <h2 className="text-xl font-bold">
          Edit Staff Member
        </h2>

        <p className="text-sm text-gray-500">
          Edit information for {selected.name}
        </p>
      </div>

      <div className="space-y-4">

        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Full Name
          </label>

          <input
            type="text"
          value={editStaff.name}
onChange={(e) =>
  setEditStaff({
    ...editStaff,
    name: e.target.value,
  })
}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        {/* Role */}
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Role
          </label>

          <input
            type="text"
            value={editStaff.role}
            onChange={(e) =>
              setEditStaff({
                ...editStaff,
                role: e.target.value,
              })
            }
            className="w-full rounded border px-3 py-2"
          />
        </div>

        {/* Rank */}
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Rank
          </label>

          <select
            value={editStaff.rank}
            onChange={(e) =>
              setEditStaff({
                ...editStaff,
                rank: e.target.value,
              })
            }
            className="w-full rounded border px-3 py-2"
          >
            <option value="Firefighter">Firefighter</option>
            <option value="Sergeant">Sergeant</option>
            <option value="Lieutenant">Lieutenant</option>
            <option value="Captain">Captain</option>
          </select>
        </div>

        {/* Shift */}
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Shift
          </label>

          <select
            value={editStaff.shift}
onChange={(e) =>
  setEditStaff({
    ...editStaff,
    shift: e.target.value,
  })
}
            className="w-full rounded border px-3 py-2"
          >
            <option value="Shift A">Shift A</option>
            <option value="Shift B">Shift B</option>
            <option value="Shift C">Shift C</option>
          </select>
        </div>

        {/* Unit */}
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Assigned Unit
          </label>

          <input
            type="text"
            value={editStaff.unit}
            onChange={(e) =>
              setEditStaff({
                ...editStaff,
                unit: e.target.value,
              })
            }
            className="w-full rounded border px-3 py-2"
          />
        </div>

        {/* TAC */}
        <div>
          <label className="mb-1 block text-sm font-semibold">
            TAC / Comms
          </label>

          <input
            type="text"
            value={editStaff.tac}
            onChange={(e) =>
              setEditStaff({
                ...editStaff,
                tac: e.target.value,
              })
            }
            className="w-full rounded border px-3 py-2"
          />
        </div>

      </div>

      <div className="mt-6 flex justify-end gap-2">

        <button
          onClick={() => setShowEditStaff(false)}
          className="rounded border px-4 py-2"
        >
          Cancel
        </button>

        <button
           onClick={() => {
    setStaff(
      staff.map((p) =>
        p.id === selected.id
          ? {
              ...p,
              name: editStaff.name,
              role: editStaff.role,
              rank: editStaff.rank,
              shift: editStaff.shift,
              unit: editStaff.unit,
              tac: editStaff.tac,
            }
          : p
      )
    );

    setShowEditStaff(false);
    alert("Staff information updated successfully!");
  }}
  className="rounded bg-red-700 px-4 py-2 font-semibold text-white"
>
  Save Changes
        </button>

      </div>

    </div>
  </div>
)}
    </div>
  );
}