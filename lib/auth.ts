"use client";
import { useSyncExternalStore } from "react";
import type { Account } from "./api";

// The server issues no token (see Server_Guide.md security note), so the signed-in
// account is only kept in localStorage to gate the UI.
const KEY = "bumberoos.account";
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Account | null } = { raw: null, value: null };

function read(): Account | null {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { /* storage unavailable */ }
  if (raw !== cache.raw) {
    let value: Account | null = null;
    try { value = raw ? (JSON.parse(raw) as Account) : null; } catch { value = null; }
    cache = { raw, value };
  }
  return cache.value;
}

export function setAccount(a: Account | null) {
  try {
    if (a) localStorage.setItem(KEY, JSON.stringify(a));
    else localStorage.removeItem(KEY);
  } catch { /* storage unavailable */ }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => { listeners.delete(cb); window.removeEventListener("storage", cb); };
};

/** undefined while hydrating on the client, null when signed out. */
export function useAccount(): Account | null | undefined {
  return useSyncExternalStore(subscribe, read, () => undefined);
}
