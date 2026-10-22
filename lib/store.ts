"use client";
import { useEffect } from "react";
import { create } from "zustand";
import { api, errMsg } from "./api";

// Every list the pages show, cached once and shared, so switching tabs renders the last copy
// straight away and refreshes it in the background instead of starting from empty.
const fetchers = {
  staff: () => api.listStaff(),
  availableStaff: () => api.listStaff("AVAILABLE"),
  items: () => api.listItems(),
  availableItems: () => api.listItems({ availableOnly: true }),
  incidents: () => api.listIncidents(),
  alerts: () => api.listAlerts(),
  accounts: () => api.listAccounts(),
};
type Fetchers = typeof fetchers;
export type ResourceKey = keyof Fetchers;
type Data<K extends ResourceKey> = Awaited<ReturnType<Fetchers[K]>>;

type Entry = { data?: unknown; error: string | null };
const useDataStore = create<{ entries: Partial<Record<ResourceKey, Entry>> }>(() => ({ entries: {} }));

const EMPTY: never[] = [];
const inFlight = new Map<ResourceKey, Promise<void>>();
// Only the newest request per key may write, so a slow response never overwrites a fresher one.
const latest = new Map<ResourceKey, number>();
let seq = 0;

function revalidate(key: ResourceKey, force = false): Promise<void> {
  const running = inFlight.get(key);
  if (running && !force) return running;
  const id = ++seq;
  latest.set(key, id);
  const p = fetchers[key]()
    .then(
      (data): Entry => ({ data, error: null }),
      // Keep showing the last good copy alongside the error.
      (e): Entry => ({ data: useDataStore.getState().entries[key]?.data, error: errMsg(e) }),
    )
    .then((entry) => {
      if (latest.get(key) !== id) return;
      useDataStore.setState((s) => ({ entries: { ...s.entries, [key]: entry } }));
    })
    .finally(() => { if (inFlight.get(key) === p) inFlight.delete(key); });
  inFlight.set(key, p);
  return p;
}

/** Cached list for `key`; refetched in the background whenever a component using it mounts. */
export function useResource<K extends ResourceKey>(key: K) {
  const entry = useDataStore((s) => s.entries[key]);
  useEffect(() => { void revalidate(key); }, [key]);
  return {
    data: (entry?.data ?? EMPTY) as Data<K>,
    error: entry?.error ?? null,
    loading: !entry,
  };
}

/** Call after any change on the server: refetches every cached list, since one action can touch several. */
export function invalidate() {
  const keys = new Set([...Object.keys(useDataStore.getState().entries), ...inFlight.keys()] as ResourceKey[]);
  return Promise.all([...keys].map((k) => revalidate(k, true))).then(() => undefined);
}

/** Drops everything, e.g. on sign-out, so the next account never sees the previous one's data. */
export function clearData() {
  latest.clear();
  inFlight.clear();
  useDataStore.setState({ entries: {} });
}
