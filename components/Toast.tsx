"use client";
import type { NotificationType } from "@/lib/api";

export type ToastItem = {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
};

// Each pop-up fades in, stays readable, then fades out slowly; the animation ending removes it.
// Hovering pauses it so the text can be read. Reduced-motion users get a fade with no movement.
const CSS = `
.bb-toast { animation: bb-toast-life 7s ease-out forwards; }
.bb-toast:hover { animation-play-state: paused; }
@keyframes bb-toast-life {
  0%   { opacity: 0; transform: translateY(8px); }
  5%   { opacity: 1; transform: translateY(0); }
  60%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .bb-toast { animation-name: bb-toast-fade; }
  @keyframes bb-toast-fade {
    0%   { opacity: 0; }
    5%   { opacity: 1; }
    60%  { opacity: 1; }
    100% { opacity: 0; }
  }
}
`;

export default function ToastStack({
  toasts, onDismiss,
}: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <>
      <style>{CSS}</style>
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => onDismiss(t.id)}
            onAnimationEnd={() => onDismiss(t.id)}
            title="Click to dismiss"
            className={`bb-toast pointer-events-auto cursor-pointer rounded-lg border border-l-4 bg-white p-3 shadow-lg ${
              t.type === "INCIDENT" ? "border-l-red-700" : "border-l-blue-600"}`}>
            <p className="text-sm font-bold">{t.title}</p>
            <p className="line-clamp-2 text-sm text-gray-600">{t.body}</p>
          </div>
        ))}
      </div>
    </>
  );
}
