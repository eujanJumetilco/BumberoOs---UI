"use client";
import { useCallback, useEffect, useState } from "react";
import CreateEventButton from "@/components/CreateEventButton";
import type { EventItem } from "@/components/EventModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/events`, { credentials: "include" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setEvents((await res.json()) as EventItem[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load events.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border bg-white px-5 py-3">
        <h1 className="text-xl font-bold">Events</h1>
        <CreateEventButton onCreated={() => void load()} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="space-y-3">
        {events.map((e) => (
          <li key={e.id} className="rounded-lg border bg-white p-5">
            <p className="font-semibold">{e.title}</p>
            <p className="text-sm text-gray-500">
              {new Date(e.eventDate).toLocaleString()} · {e.location}
            </p>
            {e.description && <p className="mt-2 text-sm text-gray-700">{e.description}</p>}
            {e.latitude != null && e.longitude != null && (
              <p className="mt-1 text-xs text-gray-500">
                Pinned at {e.latitude.toFixed(5)}, {e.longitude.toFixed(5)}
              </p>
            )}
          </li>
        ))}
        {events.length === 0 && !error && <li className="text-sm text-gray-500">No events yet.</li>}
      </ul>
    </div>
  );
}