import { Camera, Pause, Play, RotateCcw, Share2, StepForward, Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import type { FilterKind, SourceId } from "@/lib/sim/types";
import { cn } from "@/lib/utils";
import { engine, useLab } from "@/store/lab";

const SOURCES: { id: SourceId; label: string; src?: string }[] = [
  { id: "bust", label: "Bust", src: "/scenes/bust.jpg" },
  { id: "office", label: "Office", src: "/scenes/office.jpg" },
  { id: "facade", label: "Facade", src: "/scenes/facade.jpg" },
  { id: "camera", label: "Camera", src: "/scenes/camera.jpg" },
  { id: "workspace", label: "Workspace" },
  { id: "zone", label: "Zone plate" },
];

const FILTERS: { id: FilterKind; label: string }[] = [
  { id: "none", label: "None" },
  { id: "sharpen", label: "Sharpen" },
  { id: "edge", label: "Edge" },
  { id: "invert", label: "Invert" },
];

export function ControlBar() {
  const sourceId = useLab((s) => s.sourceId);
  const filter = useLab((s) => s.filter);
  const speed = useLab((s) => s.speed);
  const snap = useLab((s) => s.snap);
  const busy = useLab((s) => s.busy);
  const setSource = useLab((s) => s.setSource);
  const setFilter = useLab((s) => s.setFilter);
  const setSpeed = useLab((s) => s.setSpeed);
  const setUpload = useLab((s) => s.setUpload);
  const capture = useLab((s) => s.capture);
  const share = useLab((s) => s.share);
  const toggle = useLab((s) => s.toggle);
  const step = useLab((s) => s.step);
  const reset = useLab((s) => s.reset);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void capture()} disabled={busy} className="min-h-10">
          <Camera />
          Capture frame
        </Button>
        <Button variant="secondary" onClick={() => void share()} disabled={busy} className="min-h-10">
          <Share2 />
          Share screen
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={toggle}
          disabled={engine.mode === "idle"}
          aria-label={snap.running ? "Pause" : "Resume"}
        >
          {snap.running ? <Pause /> : <Play />}
        </Button>
        <Button variant="outline" size="icon" onClick={step} disabled={engine.mode === "idle"} aria-label="Step">
          <StepForward />
        </Button>
        <Button variant="ghost" size="icon" onClick={reset} aria-label="Reset">
          <RotateCcw />
        </Button>
        <div className="ml-auto flex min-w-40 items-center gap-3">
          <span className="font-mono text-[10px] tracking-wider text-muted uppercase">Speed</span>
          <Slider min={0.35} max={2.5} step={0.05} value={[speed]} onValueChange={([v]) => setSpeed(v ?? 1)} />
          <span className="w-8 text-right font-mono text-xs tabular">{speed.toFixed(1)}×</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSource(s.id)}
            className={cn(
              "flex h-14 w-16 flex-col overflow-hidden rounded-md border text-left",
              sourceId === s.id ? "border-accent" : "border-border hover:border-fg/30",
            )}
          >
            {s.src ? (
              <img src={s.src} alt="" className="h-9 w-full object-cover" crossOrigin="anonymous" />
            ) : (
              <span className="grid h-9 place-items-center bg-elevated font-mono text-[9px] text-muted">
                {s.id === "zone" ? "ZONE" : "WS"}
              </span>
            )}
            <span className="px-1 py-0.5 font-mono text-[9px] text-muted">{s.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cn(
            "flex h-14 w-16 flex-col items-center justify-center rounded-md border border-border text-muted hover:border-fg/30 hover:text-fg",
            sourceId === "upload" && "border-accent text-fg",
          )}
        >
          <Upload className="size-4" />
          <span className="mt-1 font-mono text-[9px]">Upload</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => setUpload(img);
            img.src = URL.createObjectURL(file);
          }}
        />
        <div className="ml-2 flex rounded-md border border-border p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-8 rounded-sm px-2.5 font-mono text-[10px] tracking-wide uppercase",
                filter === f.id ? "bg-elevated text-fg" : "text-muted hover:text-fg",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
