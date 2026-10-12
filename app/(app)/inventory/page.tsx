"use client";
import { useState } from "react";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";

type Item = {
  name: string;
  tag: string;
  location: string;
  condition: "Good" | "Maintenance" | "Retired";
  nextInspection: string;
};

const initialItems: Item[] = [
  { name: "SCBA Breathing Apparatus Pack #04", tag: "SCBA-0004", location: "Engine 4", condition: "Good", nextInspection: "14 days" },
  { name: "Hydraulic Rescue Cutter (Jaws of Life)", tag: "HYD-0012", location: "Engine 3", condition: "Maintenance", nextInspection: "Immediate Service" },
  { name: "Thermal Imaging Camera Pack #35", tag: "TIC-0035", location: "Truck 2", condition: "Good", nextInspection: "42 days" },
  { name: "2.5-inch Attack Fire Hose (50ft)", tag: "HOSE-0210", location: "Storage Bay", condition: "Retired", nextInspection: "Archived" },
  { name: "Multi-Gas Detector Sensor Unit", tag: "GAS-0007", location: "In Quarters", condition: "Good", nextInspection: "5 days" },
];

const tones = { Good: "green", Maintenance: "amber", Retired: "gray" } as const;
type Filter = "All" | Item["condition"];

export default function InventoryPage() {
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [items, setItems] = useState<Item[]>(initialItems);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [showLogCheck, setShowLogCheck] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Item | null>(null);
  const [showEquipmentDetails, setShowEquipmentDetails] = useState(false);
  const [checkResult, setCheckResult] = useState<"Passed" | "Failed">("Passed");
  const [inspector, setInspector] = useState("");
  const [checkNotes, setCheckNotes] = useState("");

  const [newEquipment, setNewEquipment] = useState<Item>({
  name: "",
  tag: "",
  location: "",
  condition: "Good",
  nextInspection: "",
});

  const visible = items.filter(
    (i) =>
      (filter === "All" || i.condition === filter) &&
      (i.name + i.tag).toLowerCase().includes(query.toLowerCase())
  );

  const count = (f: Filter) =>
    f === "All" ? items.length : items.filter((i) => i.condition === f).length;

  const filters: { key: Filter; label: string }[] = [
    { key: "All", label: "All Equipment" },
    { key: "Good", label: "Good Condition" },
    { key: "Maintenance", label: "Maintenance Needed" },
    { key: "Retired", label: "Retired" },
  ];
  const handleAddEquipment = () => {
  if (!newEquipment.name || !newEquipment.tag || !newEquipment.location) {
    alert("Please fill in all required fields.");
    return;
  }
  if (editingTag) {
    // Edit existing equipment
    setItems((prev) =>
      prev.map((item) =>
        item.tag === editingTag ? newEquipment : item
      )
    );

    setEditingTag(null);
  } else {
    // Add new equipment
    setItems((prev) => [...prev, newEquipment]);
  }

  setNewEquipment({
    name: "",
    tag: "",
    location: "",
    condition: "Good",
    nextInspection: "",
  });

  setShowAddEquipment(false);
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Apparatus & Tactical Equipment Inventory</h1>
          <p className="text-sm text-gray-600">
            Real-time telemetry, preventive readings, battery checks, and maintenance
            lifecycle for brigade assets.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded border bg-white px-4 py-2 text-sm">Scan Asset Tag</button>
          <button className="rounded border bg-white px-4 py-2 text-sm">Export CSV</button>
          <button   onClick={() => setShowAddEquipment(true)}
          className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white">
            + Add Equipment / Asset
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Total Tracked Assets">
          <p className="text-3xl font-bold">44 <span className="text-base font-normal text-gray-500">Items</span></p>
          <p className="text-xs text-gray-500">Across 4 facilities / apparatus</p>
        </StatCard>
        <StatCard title="Operational Readiness">
          <p className="text-3xl font-bold text-green-700">38 <span className="text-base font-normal">Ready</span></p>
          <p className="text-xs text-gray-500">Passing all pre-shift checks</p>
        </StatCard>
        <StatCard title="In Maintenance / Inspection">
          <p className="text-3xl font-bold text-amber-600">4 <span className="text-base font-normal">Items</span></p>
          <p className="text-xs text-gray-500">Active repair queue</p>
        </StatCard>
        <StatCard title="Retired / Decommissioned">
          <p className="text-3xl font-bold">2 <span className="text-base font-normal text-gray-500">Out of Service</span></p>
          <p className="text-xs text-gray-500">Scheduled for disposal</p>
        </StatCard>
      </div>

      {/* Filters + table */}
      <div className="rounded-lg border bg-white p-5">
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
            placeholder="Search equipment..."
            className="ml-auto w-64 rounded border px-3 py-1.5 text-sm"
          />
        </div>

        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-gray-500">
            <tr>
              <th className="py-2">Equipment / Item</th>
              <th>Serial / Tag</th>
              <th>Assigned Location</th>
              <th>Condition</th>
              <th>Next Inspection</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((i) => (
              <tr key={i.tag} className="border-t">
                <td className="py-3 font-medium">{i.name}</td>
                <td>{i.tag}</td>
                <td>{i.location}</td>
                <td>
                  <StatusBadge tone={tones[i.condition]}>{i.condition}</StatusBadge>
                </td>
                <td>{i.nextInspection}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setNewEquipment(i);
                        setEditingTag(i.tag);
                        setShowAddEquipment(true);
                      }}
                      className="rounded border px-3 py-1 text-xs"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setSelectedEquipment(i);
                        setShowLogCheck(true);
                      }}
                      className="rounded border px-3 py-1 text-xs"
                    >
                      Log Check
                    </button>

                    {i.condition !== "Retired" && (
                      <button
                        onClick={() => {
                          const confirmed = confirm(
                            `Are you sure you want to retire "${i.name}"?`
                          );

                          if (confirmed) {
                            setItems((prev) =>
                              prev.map((item) =>
                                item.tag === i.tag
                                  ? {
                                      ...item,
                                      condition: "Retired",
                                      nextInspection: "Archived",
                                    }
                                  : item
                              )
                            );
                          }
                        }}
                        className="rounded border border-red-300 px-3 py-1 text-xs text-red-600"
                      >
                        Retire
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedEquipment(i);
                        setShowEquipmentDetails(true);
                      }}
                      className="rounded border px-3 py-1 text-xs"
                    >
                      View Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  No equipment found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-gray-500">
          Showing {visible.length} of {items.length} tracked assets
        </p>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-3 font-bold">Today's Inspection Pass Rate</h2>
          <p className="text-sm">
            Engine 4 Apparatus: <span className="font-semibold text-green-700">100% Passed</span>
          </p>
          <p className="text-sm">
            Truck 2 Tactical Loadout: <span className="font-semibold text-green-700">100% Passed</span>
          </p>
          <p className="text-sm">
            Rescue Squad Packs: <span className="font-semibold text-amber-600">80% Passed</span>
          </p>
          <button className="mt-3 w-full rounded bg-red-700 py-2 text-sm font-semibold text-white">
            Submit Shift Morning Roll Call
          </button>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-3 font-bold">Regulatory Standards</h2>
          <p className="text-sm font-semibold">NFPA 1981 / 1852 Compliance</p>
          <p className="mb-2 text-xs text-gray-500">All breathing apparatus pass the annual flow test.</p>
          <p className="text-sm font-semibold">Cascade Air Refill Station</p>
          <p className="text-xs text-gray-500">Last pressure check logged this week.</p>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <h2 className="mb-3 font-bold">Field Audit Barcode Hub</h2>
          <p className="mb-3 text-sm text-gray-600">
            Use a handheld scanner or mobile camera to audit equipment on the apparatus.
          </p>
          <button className="w-full rounded bg-red-700 py-2 text-sm font-semibold text-white">
            Launch Field Audit Scanner
          </button>
        </div>
      </div>

      {/* Add Equipment Modal */}
     {showAddEquipment && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
      
      <h2 className="mb-5 text-xl font-bold">
  {editingTag ? "Edit Equipment / Asset" : "Add Equipment / Asset"}
</h2>

      {/* Equipment Name */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium">
          Equipment Name *
        </label>
     
       <input
          type="text"
          value={newEquipment.name}
          onChange={(e) =>
            setNewEquipment({
              ...newEquipment,
              name: e.target.value,
            })
          }
          placeholder="e.g. Fire Hose"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      {/* Serial / Tag */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium">
          Serial / Tag *
        </label>
        <input
          type="text"
          value={newEquipment.tag}
          onChange={(e) =>
            setNewEquipment({
              ...newEquipment,
              tag: e.target.value,
            })
          }
          placeholder="e.g. HOSE-0211"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      {/* Location */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium">
          Assigned Location *
        </label>
        <input
          type="text"
          value={newEquipment.location}
          onChange={(e) =>
            setNewEquipment({
              ...newEquipment,
              location: e.target.value,
            })
          }
          placeholder="e.g. Engine 4"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      {/* Condition */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium">
          Condition
        </label>
        <select
          value={newEquipment.condition}
          onChange={(e) =>
            setNewEquipment({
              ...newEquipment,
              condition: e.target.value as Item["condition"],
            })
          }
          className="w-full rounded border px-3 py-2 text-sm"
        >
          <option value="Good">Good</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Retired">Retired</option>
        </select>
      </div>

      {/* Next Inspection */}
     <div className="mb-6">
  <label className="mb-1 block text-sm font-medium">
    Next Inspection
  </label>

  <input
    type="text"
    value={newEquipment.nextInspection}
    onChange={(e) =>
      setNewEquipment({
        ...newEquipment,
        nextInspection: e.target.value,
      })
    }
                placeholder="e.g. 30 days"
                className="w-full rounded border px-3 py-2 text-sm"
              />
          
      </div>
      {/* Buttons */}
        <div className="flex justify-end gap-2">
  <button
    onClick={() => {
      setShowAddEquipment(false);
      setEditingTag(null);
    }}
    className="rounded border px-4 py-2 text-sm" 
  >
    Cancel
   </button>

  <button
    onClick={handleAddEquipment}
    className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white"
  >
    {editingTag ? "Save Changes" : "Add Equipment"}
  </button> 

    </div>
  </div></div>      )}
      {/* Log Equipment Check Modal */}
{showLogCheck && selectedEquipment && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">

      <h2 className="mb-5 text-xl font-bold">
        Log Equipment Check
      </h2>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium">
          Equipment
        </label>

        <div className="rounded border bg-gray-50 px-3 py-2 text-sm">
          {selectedEquipment.name}
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">
          Check Result
        </label>

        <div className="flex gap-4">
          <label>
            <input
              type="radio"
              checked={checkResult === "Passed"}
              onChange={() => setCheckResult("Passed")}
            />
            {" "}Passed
          </label>

          <label>
            <input
              type="radio"
              checked={checkResult === "Failed"}
              onChange={() => setCheckResult("Failed")}
            />
            {" "}Failed
          </label>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium">
          Inspector
        </label>

        <input
          type="text"
          value={inspector}
          onChange={(e) => setInspector(e.target.value)}
          placeholder="Enter inspector name"
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium">
          Notes
        </label>

        <textarea
          value={checkNotes}
          onChange={(e) => setCheckNotes(e.target.value)}
          placeholder="Enter inspection notes"
          rows={3}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setShowLogCheck(false);
            setSelectedEquipment(null);
            setInspector("");
            setCheckNotes("");
            setCheckResult("Passed");
          }}
          className="rounded border px-4 py-2 text-sm"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            alert(
              `Equipment check saved!\n\nEquipment: ${selectedEquipment.name}\nResult: ${checkResult}\nInspector: ${inspector}`
            );

            setShowLogCheck(false);
            setSelectedEquipment(null);
            setInspector("");
            setCheckNotes("");
            setCheckResult("Passed");
          }}
          className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Save Check
        </button>
      </div>

    </div>
  </div>
)}
      {showEquipmentDetails && selectedEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">

            <h2 className="mb-5 text-xl font-bold">
              Equipment Details
            </h2>

            <div className="space-y-4">

              <div>
                <p className="text-xs text-gray-500">
                  Equipment Name
                </p>
                <p className="font-medium">
                  {selectedEquipment.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Serial / Tag
                </p>
                <p className="font-medium">
                  {selectedEquipment.tag}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Assigned Location
                </p>
                <p className="font-medium">
                  {selectedEquipment.location}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Condition
                </p>
                <p className="font-medium">
                  {selectedEquipment.condition}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Next Inspection
                </p>
                <p className="font-medium">
                  {selectedEquipment.nextInspection}
                </p>
              </div>

            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowEquipmentDetails(false);
                  setSelectedEquipment(null);
                }}
                className="rounded border px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}