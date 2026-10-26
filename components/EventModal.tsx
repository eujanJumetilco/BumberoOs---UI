"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import ErrorBanner from "./ErrorBanner";
import Modal, { Field, inputCls } from "./Modal";
import type { LatLng } from "@/lib/map";

// Leaflet touches `window`, so the map only loads in the browser.
const LocationPicker = dynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => <p className="mb-4 text-sm text-gray-500">Loading map...</p>,
});

export type EventItem = {
  id: number;
  title: string;
  description: string | null;
  location: string;
  eventDate: string;
  latitude: number | null;
  longitude: number | null;
};

export default function EventModal({
  onClose, onCreated,
}: { onClose: () => void; onCreated: (e: EventItem) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState(""); // "YYYY-MM-DDTHH:mm" from datetime-local
  const [pin, setPin] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !location.trim() || !eventDate) {
      setError("Title, location and event date are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          location: location.trim(),
          eventDate,
          latitude: pin?.lat,
          longitude: pin?.lng,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? body?.message ?? `Request failed (${res.status})`);
      }
      onCreated((await res.json()) as EventItem);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the event.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Create New Event" onClose={onClose}>
      <Field label="Title *">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} className={inputCls} />
      </Field>
      <Field label="Description">
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          maxLength={2000} rows={3} className={inputCls} />
      </Field>
      <Field label="Event Date & Time *">
        <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
          className={inputCls} />
      </Field>
      <Field label="Location *">
        <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
      </Field>
      <div className="mb-4">
        <p className="mb-1 text-sm font-semibold">Map location (optional)</p>
        <LocationPicker value={pin} onChange={setPin} initialQuery={location} />
      </div>

      <ErrorBanner message={error} />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded border px-4 py-2 text-sm">Cancel</button>
        <button onClick={submit} disabled={busy}
          className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Saving..." : "Save Event"}
        </button>
      </div>
    </Modal>
  );
}