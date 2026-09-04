import type { Snapshot } from "@/lib/sim/types";
import { cn } from "@/lib/utils";

function Meter({ label, value, tone }: { label: string; value: number; tone: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] tracking-wider text-muted uppercase">{label}</span>
        <span className="font-mono text-[10px] text-fg tabular">{pct}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-elevated">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function MetricsBar({ snap }: { snap: Snapshot }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
      <Meter label="CPU 68040" value={snap.metrics.cpu} tone="bg-accent" />
      <Meter label="DSP 56001" value={snap.metrics.dsp} tone="bg-path-in" />
      <Meter label="NeXTbus" value={snap.metrics.bus} tone="bg-copper" />
      <div className="min-w-0">
        <p className="mb-1 font-mono text-[10px] tracking-wider text-muted uppercase">Net</p>
        <p className="font-mono text-sm text-fg tabular">{snap.metrics.netKbps.toFixed(0)} kb/s</p>
      </div>
      <div className="min-w-0">
        <p className="mb-1 font-mono text-[10px] tracking-wider text-muted uppercase">Cache hit</p>
        <p className="font-mono text-sm text-fg tabular">{(snap.metrics.cacheHit * 100).toFixed(0)}%</p>
      </div>
      <div className="min-w-0">
        <p className="mb-1 font-mono text-[10px] tracking-wider text-muted uppercase">Burst</p>
        <p className="font-mono text-sm text-fg tabular">{snap.metrics.busMBps.toFixed(1)} MB/s</p>
      </div>
    </div>
  );
}
