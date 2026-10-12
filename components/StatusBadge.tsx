type Tone = "red" | "green" | "amber" | "gray";

const tones: Record<Tone, string> = {
  red: "bg-red-100 text-red-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  gray: "bg-gray-100 text-gray-600",
};

export default function StatusBadge({ tone = "gray", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}