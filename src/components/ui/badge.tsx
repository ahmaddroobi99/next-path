import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "mute",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "mute" | "copper" | "ok" | "warn" | "danger" | "signal";
}) {
  const tones = {
    mute: "border-border bg-surface-2 text-muted",
    copper: "border-copper/30 bg-copper/15 text-copper",
    ok: "border-ok/30 bg-ok/15 text-ok",
    warn: "border-warn/30 bg-warn/15 text-warn",
    danger: "border-danger/30 bg-danger/15 text-danger",
    signal: "border-signal/30 bg-signal/15 text-signal",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
