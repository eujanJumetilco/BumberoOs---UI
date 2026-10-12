export default function TopBar() {
  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      <div>
        <p className="font-bold">BumberoOs Command</p>
        <p className="text-xs text-gray-500">Station 4 · Metro Central</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
          Station Status: Ready
        </span>
        <button className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white">
          Emergency Alert
        </button>
      </div>
    </header>
  );
}