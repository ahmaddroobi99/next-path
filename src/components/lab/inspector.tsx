import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import type { LogEntry, NetworkCfg, Snapshot } from "@/lib/sim/types";
import { cn } from "@/lib/utils";
import { useLab } from "@/store/lab";

function kindClass(k: LogEntry["kind"]) {
  if (k === "drop") return "text-accent";
  if (k === "rtx") return "text-path-out";
  if (k === "tx") return "text-path-in";
  if (k === "sys") return "text-muted";
  return "text-fg";
}

export function Inspector({ snap, network }: { snap: Snapshot; network: NetworkCfg }) {
  const setNetwork = useLab((s) => s.setNetwork);

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Data inspector</p>
          <span className="font-mono text-[10px] text-subtle tabular">{snap.inspector.address}</span>
        </div>
        <p className="mb-2 truncate text-xs text-muted">{snap.inspector.label}</p>
        <pre className="overflow-x-auto rounded-md bg-chip px-3 py-2 font-mono text-[10px] leading-relaxed text-phosphor">
          {snap.inspector.hex.map((line, i) => (
            <div key={i}>
              <span className="text-subtle">{(i * 16).toString(16).padStart(4, "0")}</span> {line}
            </div>
          ))}
        </pre>
      </div>

      <div className="min-h-0 flex-1">
        <p className="mb-1.5 font-mono text-[10px] tracking-wider text-muted uppercase">Packet log</p>
        <div className="h-36 overflow-auto rounded-md bg-chip px-2 py-1 font-mono text-[10px] leading-5">
          {snap.log.length === 0 ? (
            <p className="px-1 py-3 text-subtle">No frames on the wire.</p>
          ) : (
            snap.log.map((e, i) => (
              <div key={`${e.seq}-${i}`} className={cn("flex gap-2 tabular", kindClass(e.kind))}>
                <span className="w-8 shrink-0 uppercase">{e.kind}</span>
                <span className="min-w-0 flex-1 truncate">{e.note}</span>
                <span className="text-subtle">{e.bytes} B</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] tracking-wider text-muted uppercase">Link conditions</p>
        <div className="grid gap-3">
          <LinkRow label="Bandwidth" value={`${network.bandwidth.toFixed(1)} Mbps`}>
            <Slider
              min={1}
              max={10}
              step={0.5}
              value={[network.bandwidth]}
              onValueChange={([v]) => setNetwork({ bandwidth: v ?? 10 })}
            />
          </LinkRow>
          <LinkRow label="Latency" value={`${network.latency} ms`}>
            <Slider
              min={1}
              max={200}
              step={1}
              value={[network.latency]}
              onValueChange={([v]) => setNetwork({ latency: v ?? 12 })}
            />
          </LinkRow>
          <LinkRow label="Loss" value={`${network.loss.toFixed(0)}%`}>
            <Slider
              min={0}
              max={15}
              step={1}
              value={[network.loss]}
              onValueChange={([v]) => setNetwork({ loss: v ?? 0 })}
            />
          </LinkRow>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="out">{snap.bytesOnWire.toLocaleString()} B on wire</Badge>
          <Badge>{snap.dropped} drops</Badge>
          <Badge>{snap.retransmits} RTX</Badge>
          <Badge variant="in">{(snap.compressRatio * 100).toFixed(0)}% of raw</Badge>
        </div>
      </div>
    </div>
  );
}

function LinkRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <label className="grid grid-cols-[88px_1fr_72px] items-center gap-3 text-xs">
      <span className="text-muted">{label}</span>
      {children}
      <span className="text-right font-mono text-fg tabular">{value}</span>
    </label>
  );
}
