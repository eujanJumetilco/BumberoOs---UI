export default function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase text-gray-500">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}