"use client";
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import ToastStack, { type ToastItem } from "@/components/Toast";
import { api, type AppNotification, type NotificationType } from "@/lib/api";
import { useAccount } from "@/lib/auth";
import { useSettings, type Settings } from "@/lib/settings";

// The live feed connects straight to the Spring server (CORS and the session cookie are already allowed
// for http://localhost:3000). Next.js' /api proxy can hold back a never-ending response, so it is bypassed
// here. Set NEXT_PUBLIC_STREAM_URL (no trailing slash) if the server is not on localhost:8080.
const STREAM_URL = `${process.env.NEXT_PUBLIC_STREAM_URL ?? "http://localhost:8080"}/api/notifications/stream`;

const MAX_KEPT = 100;
const MAX_TOASTS = 3;
const RETRY_BASE_MS = 2000;
const RETRY_MAX_MS = 30000;

type NotificationContextValue = {
  /** Newest first, already filtered by the Report / Event toggles in Settings. */
  notifications: AppNotification[];
  unreadCount: number;
  /** False while the live feed is reconnecting. */
  connected: boolean;
  markRead: (id: number) => void;
  markAllRead: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}

const typeEnabled = (type: NotificationType, s: Settings) =>
  type === "INCIDENT" ? s.notifyReports : s.notifyEvents;

const toastTitle = (type: NotificationType) => (type === "INCIDENT" ? "New incident report" : "New event");

/** Merges by id, newest first. A notification already marked read here stays read. */
function merge(current: AppNotification[], incoming: AppNotification[]): AppNotification[] {
  const byId = new Map<number, AppNotification>();
  for (const n of current) byId.set(n.id, n);
  for (const n of incoming) {
    const existing = byId.get(n.id);
    byId.set(n.id, existing?.read ? { ...n, read: true } : n);
  }
  return [...byId.values()].sort((a, b) => b.id - a.id).slice(0, MAX_KEPT);
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const account = useAccount();
  const accountId = account?.id;
  const settings = useSettings();

  const [all, setAll] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [connected, setConnected] = useState(false);

  // The stream handler outlives renders, so it reads the latest settings through a ref.
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (accountId === undefined) {
      setAll([]);
      setToasts([]);
      setConnected(false);
      return;
    }

    let closed = false;
    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let reconnecting = false;

    const load = () => {
      api.listNotifications()
        .then((list) => { if (!closed) setAll((prev) => merge(prev, list)); })
        .catch(() => { /* offline: the list refreshes on the next reconnect */ });
    };

    const showToast = (n: AppNotification) => {
      const s = settingsRef.current;
      if (!typeEnabled(n.type, s)) return;
      const item: ToastItem = {
        id: n.id,
        type: n.type,
        title: toastTitle(n.type),
        body: s.showPreviews ? n.message : "Open the bell to see the details.",
      };
      setToasts((prev) => [...prev.filter((t) => t.id !== n.id), item].slice(-MAX_TOASTS));
    };

    const connect = () => {
      if (closed) return;
      const es = new EventSource(STREAM_URL, { withCredentials: true });
      source = es;

      es.addEventListener("connected", () => {
        attempt = 0;
        setConnected(true);
        // Anything saved while the feed was down is picked up here (without pop-ups).
        if (reconnecting) load();
        reconnecting = false;
      });

      es.addEventListener("notification", (ev) => {
        let n: AppNotification;
        try { n = JSON.parse((ev as MessageEvent<string>).data) as AppNotification; } catch { return; }
        setAll((prev) => merge(prev, [n]));
        showToast(n);
      });

      es.onerror = () => {
        // Close and retry ourselves with a growing delay (a 401 would otherwise stop the browser retrying).
        es.close();
        if (source === es) source = null;
        setConnected(false);
        reconnecting = true;
        if (closed) return;
        const delay = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** attempt);
        attempt += 1;
        retryTimer = setTimeout(connect, delay);
      };
    };

    load();
    connect();

    return () => {
      closed = true;
      clearTimeout(retryTimer);
      source?.close();
      setConnected(false);
    };
  }, [accountId]);

  const markRead = useCallback((id: number) => {
    setAll((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    api.markNotificationRead(id).catch(() => { /* resyncs on the next reconnect */ });
  }, []);

  const markAllRead = useCallback(() => {
    setAll((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
    api.markAllNotificationsRead().catch(() => { /* resyncs on the next reconnect */ });
  }, []);

  const notifications = useMemo(
    () => all.filter((n) => typeEnabled(n.type, settings)),
    [all, settings],
  );
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo<NotificationContextValue>(
    () => ({ notifications, unreadCount, connected, markRead, markAllRead }),
    [notifications, unreadCount, connected, markRead, markAllRead],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}
