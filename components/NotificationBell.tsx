"use client";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/components/NotificationContext";
import { fmtDateTime } from "@/lib/api";

const TYPE_LABEL = { INCIDENT: "Incident", EVENT: "Event" } as const;

export default function NotificationBell() {
  const { notifications, unreadCount, connected, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-red-700 px-1 text-center text-[10px] font-bold leading-5 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <p className="text-sm font-bold">
              Notifications
              {!connected && <span className="ml-2 text-xs font-normal text-gray-500">Reconnecting…</span>}
            </p>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="text-xs font-semibold text-red-700 disabled:text-gray-400">
              Mark all as read
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-500">No notifications yet.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="border-b last:border-b-0">
                  <button
                    onClick={() => { if (!n.read) markRead(n.id); }}
                    className={`block w-full px-3 py-2 text-left hover:bg-gray-50 ${n.read ? "" : "bg-red-50"}`}>
                    <span className="flex items-center gap-2">
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-red-700" aria-label="Unread" />}
                      <span className="text-xs font-semibold uppercase text-gray-500">{TYPE_LABEL[n.type]}</span>
                    </span>
                    <span className={`block text-sm ${n.read ? "text-gray-600" : "font-semibold"}`}>{n.message}</span>
                    <span className="block text-xs text-gray-500">{fmtDateTime(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
