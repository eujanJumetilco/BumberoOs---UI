"use client";
import { useState } from "react";
import EventModal, { type EventItem } from "./EventModal";

export default function CreateEventButton({
  onCreated,
}: { onCreated?: (e: EventItem) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="rounded border border-red-700 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
        + Create Event
      </button>
      {open && (
        <EventModal
          onClose={() => setOpen(false)}
          onCreated={(e) => { setOpen(false); onCreated?.(e); }}
        />
      )}
    </>
  );
}