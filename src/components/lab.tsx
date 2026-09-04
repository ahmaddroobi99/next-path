import { useEffect, useState } from "react";
import { BoardPhoto } from "@/components/board-photo";
import { BoardSchematic } from "@/components/board-schematic";
import { ControlDock } from "@/components/control-dock";
import { MegaPixelCrt, RemoteCrt } from "@/components/crt-displays";
import { Inspector } from "@/components/inspector";
import { PowerOn } from "@/components/power-on";
import { Button } from "@/components/ui/button";
import { useSim } from "@/lib/sim/store";
import { cn } from "@/lib/utils";

type Pane = "board" | "path" | "screens" | "inspect";

function SimClock() {
  const tick = useSim((s) => s.tick);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick]);
  return null;
}

function Header({
  pane,
  setPane,
}: {
  pane: Pane;
  setPane: (p: Pane) => void;
}) {
  const view = useSim((s) => s.view);
  const setView = useSim((s) => s.setView);
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-medium tracking-tight text-fg">NeXT Path</span>
        <span className="hidden font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle sm:inline">
          Motherboard signal lab
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden sm:flex gap-1">
          <Button size="sm" variant={view === "photo" ? "primary" : "ghost"} onClick={() => setView("photo")}>
            Board
          </Button>
          <Button
            size="sm"
            variant={view === "schematic" ? "primary" : "ghost"}
            onClick={() => setView("schematic")}
          >
            Schematic
          </Button>
        </div>
        <nav className="flex gap-1 lg:hidden">
          {(
            [
              ["board", "Board"],
              ["path", "Path"],
              ["screens", "CRTs"],
              ["inspect", "Inspect"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              size="sm"
              variant={pane === id ? "primary" : "ghost"}
              onClick={() => setPane(id)}
            >
              {label}
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function Lab() {
  const powered = useSim((s) => s.powered);
  const view = useSim((s) => s.view);
  const setView = useSim((s) => s.setView);
  const [pane, setPane] = useState<Pane>("board");

  if (!powered) return <PowerOn />;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <SimClock />
      <Header pane={pane} setPane={setPane} />
      <div className="mx-auto hidden min-h-0 w-full max-w-[1680px] flex-1 grid-cols-[minmax(230px,280px)_minmax(0,1fr)_minmax(280px,340px)] gap-4 overflow-hidden p-4 lg:grid">
        <aside className="min-h-0 overflow-y-auto pr-1">
          <ControlDock />
        </aside>
        <section className="flex min-h-0 flex-col overflow-auto">
          {view === "photo" ? <BoardPhoto /> : <BoardSchematic />}
        </section>
        <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          <Inspector />
          <MegaPixelCrt />
          <RemoteCrt />
        </aside>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:hidden">
        <div className={cn(pane === "board" ? "block" : "hidden")}>
          <div className="mb-3 flex gap-2">
            <Button size="sm" variant={view === "photo" ? "primary" : "secondary"} onClick={() => setView("photo")}>
              Photograph
            </Button>
            <Button
              size="sm"
              variant={view === "schematic" ? "primary" : "secondary"}
              onClick={() => setView("schematic")}
            >
              Schematic
            </Button>
          </div>
          {view === "photo" ? <BoardPhoto /> : <BoardSchematic />}
        </div>
        <div className={cn(pane === "path" ? "block" : "hidden")}>
          <ControlDock />
        </div>
        <div className={cn(pane === "screens" ? "block space-y-6" : "hidden")}>
          <MegaPixelCrt />
          <RemoteCrt />
        </div>
        <div className={cn(pane === "inspect" ? "block" : "hidden")}>
          <Inspector />
        </div>
      </div>
    </div>
  );
}
