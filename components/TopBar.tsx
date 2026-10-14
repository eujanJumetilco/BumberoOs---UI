"use client";
import { useAccount } from "@/lib/auth";
import { api } from "@/lib/api";
import { useLoad } from "@/lib/useLoad";

export default function TopBar() {
  const account = useAccount();
  const { data: ongoing, error } = useLoad(() => api.listIncidents({ status: "ONGOING" }), []);
  const online = !error;

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      <div>
        <p className="font-bold">BumberoOs Command</p>
        <p className="text-xs text-gray-500">
          {account?.displayName ?? account?.email} · {account?.role === "ADMIN" ? "Admin" : "Dispatcher"}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span className={`rounded px-2 py-1 text-xs ${
          !online ? "bg-gray-200 text-gray-700"
            : ongoing.length ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
        }`}>
          {!online ? "Server Offline"
            : ongoing.length ? `${ongoing.length} Ongoing Incident${ongoing.length > 1 ? "s" : ""}`
            : "Station Status: Ready"}
        </span>
      </div>
    </header>
  );
}
