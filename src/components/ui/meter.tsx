import { cn } from "@/lib/utils";

export function Meter({
  label,
  value,
  tone = "copper",
}: {
  label: string;
  value: number;
  tone?: "copper" | "signal" | "ok" | "warn";
}) {
  const v = Math.max(0, Math.min(100, value));
  const fill = {
    copper: "bg-copper",
    signal: "bg-signal",
    ok: "bg-ok",
    warn: "bg-warn",
  }[tone];
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
          {label}
        </span>
        <span className="tabular font-mono text-xs text-fg">{Math.round(v)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-3">
        <div
          className={cn("h-full rounded-full transition-[width] duration-200 ease-out", fill)}
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}
