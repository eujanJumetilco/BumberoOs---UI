"use client";
import { useRef, useState } from "react";

type Props = {
  path: string;
  filename: string;
  onImported?: () => void | Promise<void>;
  onError: (message: string) => void;
};

async function readError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const body = JSON.parse(text) as { message?: string };
    if (body.message) return body.message;
  } catch { }
  return `Request failed (${res.status})`;
}

export default function FileIOButtons({ path, filename, onImported, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const exportFile = async () => {
    setBusy(true); setNotice(null);
    try {
      // Relative path para dumaan sa proxy
      const res = await fetch(`/api/${path}/export?format=psv`);
      if (!res.ok) throw new Error(await readError(res));
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url; a.download = `${filename}.psv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  const importFile = async (file: File) => {
    setBusy(true); setNotice(null);
    try {
      const body = new FormData();
      body.append("file", file);
      // Relative path para dumaan sa proxy
      const res = await fetch(`/api/${path}/import`, { method: "POST", body });
      if (!res.ok) throw new Error(await readError(res));
      const { imported } = (await res.json()) as { imported: number };
      await onImported?.();
      setNotice(`Imported ${imported} row${imported === 1 ? "" : "s"}.`);
      setTimeout(() => setNotice(null), 5000);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  // Spinner color fix (itim para visible sa white bg)
  const Spinner = () => (
    <svg className="h-4 w-4 animate-spin text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const btn = "flex items-center justify-center gap-2 rounded border bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50 hover:bg-gray-50";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={() => void exportFile()} className={btn}>
          {busy && <Spinner />}
          Export PSV
        </button>
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className={btn}>
          {busy && <Spinner />}
          Import File
        </button>
        <input ref={inputRef} type="file" accept=".csv,.psv,text/csv,text/plain" className="hidden"
          onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void importFile(file); }} />
      </div>
      {notice && <p className="text-xs text-green-700">{notice}</p>}
    </div>
  );
}