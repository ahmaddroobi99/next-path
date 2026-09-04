import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChipSheet } from "@/components/lab/chip-sheet";
import { ControlBar } from "@/components/lab/controls";
import { MegaPixel, RemoteViewer } from "@/components/lab/displays";
import { Inspector } from "@/components/lab/inspector";
import { Intro } from "@/components/lab/intro";
import { MetricsBar } from "@/components/lab/metrics";
import { Motherboard } from "@/components/lab/motherboard";
import { StageBanner } from "@/components/lab/stage-banner";
import { engine, useLab } from "@/store/lab";
import { cn } from "@/lib/utils";

export function LabApp() {
  const snap = useLab((s) => s.snap);
  const intro = useLab((s) => s.intro);
  const ready = useLab((s) => s.ready);
  const selected = useLab((s) => s.selectedChip);
  const tab = useLab((s) => s.tab);
  const localFrame = useLab((s) => s.localFrame);
  const remoteFrame = useLab((s) => s.remoteFrame);
  const setChip = useLab((s) => s.setChip);
  const setTab = useLab((s) => s.setTab);
  const tick = useLab((s) => s.tick);
  const toggle = useLab((s) => s.toggle);
  const capture = useLab((s) => s.capture);
  const share = useLab((s) => s.share);
  const reset = useLab((s) => s.reset);
  const step = useLab((s) => s.step);
  const hydrate = useLab((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    let last = performance.now();
    let id = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      tick(dt);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [tick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.key === "Enter") {
        void capture();
      } else if (e.key === "s" || e.key === "S") {
        void share();
      } else if (e.key === "r" || e.key === "R") {
        reset();
      } else if (e.key === ".") {
        step();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, capture, share, reset, step]);

  const pathKind = snap.mode === "pixel" ? "in" : snap.mode === "share" ? "out" : null;
  const showLocal = !!localFrame && (snap.mode !== "pixel" || snap.t >= 0.72);
  const showRemote = !!remoteFrame && snap.mode === "share";

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative flex min-h-dvh flex-col bg-bg text-fg">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div>
            <p className="font-mono text-[10px] tracking-[0.28em] text-muted uppercase">NeXTcube lab</p>
            <h1 className="text-lg font-medium tracking-tight">Cube Trace</h1>
          </div>
          <p className="hidden text-right font-mono text-[10px] text-subtle sm:block">
            MC68040 · 25 MHz · 1120×832 · 10BASE-T
          </p>
        </header>

        <nav className="flex border-b border-border lg:hidden">
          {(
            [
              ["board", "Board"],
              ["screens", "Screens"],
              ["data", "Data"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "h-11 flex-1 font-mono text-[11px] tracking-wider uppercase",
                tab === id ? "border-b-2 border-accent text-fg" : "text-muted",
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        <main className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
          <section className={cn("flex min-h-0 flex-col gap-3", tab !== "board" && "hidden lg:flex")}>
            <ControlBar />
            <StageBanner snap={snap} />
            <div className="min-h-[280px] flex-1 overflow-hidden rounded-xl bg-pcb-dark shadow-[var(--shadow-border)]">
              <Motherboard
                packets={snap.packets}
                util={snap.util}
                selected={selected}
                onSelect={setChip}
                pathKind={pathKind}
              />
            </div>
          </section>

          <aside
            className={cn(
              "flex min-h-0 flex-col gap-3",
              tab === "board" && "hidden lg:flex",
            )}
          >
            <div
              className={cn(
                "grid min-h-[280px] flex-1 grid-rows-2 gap-3",
                tab === "data" && "hidden lg:grid",
              )}
            >
              <MegaPixel gray={showLocal ? localFrame : null} live={showLocal && snap.running} />
              <RemoteViewer
                gray={showRemote ? remoteFrame : null}
                tiles={snap.remoteTiles}
                total={snap.remoteTotal}
                latency={engine.network.latency}
              />
            </div>
            <div className={cn("min-h-0", tab === "screens" && "hidden lg:block")}>
              <Inspector snap={snap} network={engine.network} />
            </div>
          </aside>
        </main>

        <footer className="border-t border-border px-4 py-3 sm:px-6">
          <MetricsBar snap={snap} />
        </footer>

        <ChipSheet />
        {ready && intro && <Intro />}
      </div>
    </TooltipProvider>
  );
}
