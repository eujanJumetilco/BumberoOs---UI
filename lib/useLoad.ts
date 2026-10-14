"use client";
import { useCallback, useEffect, useState } from "react";
import { errMsg } from "./api";

/** Loads data on mount and exposes reload(). */
export function useLoad<T>(fn: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setData(await fn());
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch on mount: the one legitimate setState-in-effect (syncing with an external server).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void reload(); }, [reload]);
  return { data, error, loading, reload };
}
