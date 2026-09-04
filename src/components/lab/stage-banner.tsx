import { Badge } from "@/components/ui/badge";
import type { Snapshot } from "@/lib/sim/types";

export function StageBanner({ snap }: { snap: Snapshot }) {
  if (!snap.stage) {
    return (
      <div className="rounded-md bg-elevated px-4 py-3">
        <p className="font-mono text-[10px] tracking-wider text-muted uppercase">Idle</p>
        <p className="text-sm text-fg">Capture a frame or share the screen to put data on the bus.</p>
      </div>
    );
  }
  return (
    <div className="rounded-md bg-elevated px-4 py-3">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Badge variant={snap.mode === "share" ? "out" : "in"}>
          {snap.mode === "share" ? "Path 2 · share" : "Path 1 · pixel"}
        </Badge>
        <span className="font-mono text-[10px] text-subtle tabular">
          Stage {snap.stageIndex + 1} · {(snap.t * 100).toFixed(0)}%
        </span>
      </div>
      <p className="text-sm font-medium text-fg">{snap.stage.title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted">{snap.stage.detail}</p>
      <p className="mt-1 font-mono text-[10px] text-subtle">{snap.stage.format}</p>
    </div>
  );
}
